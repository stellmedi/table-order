import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItemRequest {
  menu_item_id: string;
  quantity: number;
  variation_id?: string;
  addon_ids?: { id: string; quantity: number }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { restaurant_id, items, coupon_code, source = 'widget' } = await req.json();

    if (!restaurant_id || !items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid request body');
      return new Response(
        JSON.stringify({ error: 'Invalid request: restaurant_id and items are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating order for restaurant: ${restaurant_id}, items: ${items.length}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify restaurant exists and is active
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('id', restaurant_id)
      .eq('is_active', true)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      console.error('Restaurant not found or inactive');
      return new Response(
        JSON.stringify({ error: 'Restaurant not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch menu items to calculate prices
    const itemIds = items.map((item: OrderItemRequest) => item.menu_item_id);
    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('id, price, name')
      .in('id', itemIds);

    if (menuItemsError) {
      console.error('Error fetching menu items:', menuItemsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch menu items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Collect all variation IDs and addon IDs
    const variationIds: string[] = [];
    const addonIds: string[] = [];
    
    items.forEach((item: OrderItemRequest) => {
      if (item.variation_id) variationIds.push(item.variation_id);
      if (item.addon_ids) {
        item.addon_ids.forEach(a => addonIds.push(a.id));
      }
    });

    // Fetch variations if any
    let variationsMap = new Map<string, any>();
    if (variationIds.length > 0) {
      const { data: variations } = await supabase
        .from('menu_item_variations')
        .select('id, name, price_adjustment')
        .in('id', variationIds);
      
      variations?.forEach(v => variationsMap.set(v.id, v));
    }

    // Fetch addons if any
    let addonsMap = new Map<string, any>();
    if (addonIds.length > 0) {
      const { data: addons } = await supabase
        .from('menu_item_addons')
        .select('id, name, price')
        .in('id', addonIds);
      
      addons?.forEach(a => addonsMap.set(a.id, a));
    }

    // Calculate subtotal
    const menuItemMap = new Map(menuItems?.map(mi => [mi.id, mi]) || []);
    let subtotal = 0;
    
    const orderItemsData: any[] = [];
    const orderItemVariations: any[] = [];
    const orderItemAddons: any[] = [];

    items.forEach((item: OrderItemRequest, index: number) => {
      const menuItem = menuItemMap.get(item.menu_item_id);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${item.menu_item_id}`);
      }

      let itemPrice = Number(menuItem.price);
      
      // Add variation price adjustment
      if (item.variation_id && variationsMap.has(item.variation_id)) {
        const variation = variationsMap.get(item.variation_id);
        itemPrice += Number(variation.price_adjustment);
        
        // Store variation info for later
        orderItemVariations.push({
          itemIndex: index,
          variation_id: item.variation_id,
          variation_name: variation.name,
          price_adjustment: Number(variation.price_adjustment)
        });
      }

      // Calculate addons total
      let addonsTotal = 0;
      if (item.addon_ids) {
        item.addon_ids.forEach(addonReq => {
          if (addonsMap.has(addonReq.id)) {
            const addon = addonsMap.get(addonReq.id);
            const addonCost = Number(addon.price) * addonReq.quantity;
            addonsTotal += addonCost;
            
            // Store addon info for later
            orderItemAddons.push({
              itemIndex: index,
              addon_id: addonReq.id,
              addon_name: addon.name,
              price: Number(addon.price),
              quantity: addonReq.quantity
            });
          }
        });
      }

      const totalItemPrice = (itemPrice + addonsTotal) * item.quantity;
      subtotal += totalItemPrice;

      orderItemsData.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: itemPrice + addonsTotal // Price per unit including addons
      });
    });

    // Apply discount if coupon code provided
    let discount = 0;
    let appliedDiscount = null;
    if (coupon_code) {
      const { data: discountData } = await supabase
        .from('discounts')
        .select('*')
        .eq('restaurant_id', restaurant_id)
        .eq('coupon_code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .eq('type', 'coupon')
        .maybeSingle();

      if (discountData) {
        appliedDiscount = discountData;
        if (discountData.value_type === 'percentage') {
          discount = (subtotal * Number(discountData.value)) / 100;
        } else {
          discount = Number(discountData.value);
        }
      }
    }

    const total = Math.max(0, subtotal - discount);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id,
        status: 'new',
        total,
        discount_applied: discount,
        coupon_code: coupon_code || null
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create order items
    const orderItemsWithOrderId = orderItemsData.map((item: any) => ({
      ...item,
      order_id: order.id
    }));

    const { data: createdOrderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId)
      .select();

    if (orderItemsError) {
      console.error('Error creating order items:', orderItemsError);
      await supabase.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create order items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create order item variations
    if (orderItemVariations.length > 0 && createdOrderItems) {
      const variationsToInsert = orderItemVariations.map(v => ({
        order_item_id: createdOrderItems[v.itemIndex].id,
        variation_id: v.variation_id,
        variation_name: v.variation_name,
        price_adjustment: v.price_adjustment
      }));

      const { error: variationsError } = await supabase
        .from('order_item_variations')
        .insert(variationsToInsert);

      if (variationsError) {
        console.error('Error creating order item variations:', variationsError);
      }
    }

    // Create order item addons
    if (orderItemAddons.length > 0 && createdOrderItems) {
      const addonsToInsert = orderItemAddons.map(a => ({
        order_item_id: createdOrderItems[a.itemIndex].id,
        addon_id: a.addon_id,
        addon_name: a.addon_name,
        price: a.price,
        quantity: a.quantity
      }));

      const { error: addonsError } = await supabase
        .from('order_item_addons')
        .insert(addonsToInsert);

      if (addonsError) {
        console.error('Error creating order item addons:', addonsError);
      }
    }

    console.log(`Order created successfully: ${order.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        order_number: order.id.slice(0, 8).toUpperCase(),
        subtotal,
        discount,
        total,
        applied_discount: appliedDiscount ? appliedDiscount.name : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
