import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const itemIds = items.map((item: any) => item.menu_item_id);
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

    // Calculate subtotal
    const menuItemMap = new Map(menuItems?.map(mi => [mi.id, mi]) || []);
    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const menuItem = menuItemMap.get(item.menu_item_id);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${item.menu_item_id}`);
      }
      const itemTotal = Number(menuItem.price) * item.quantity;
      subtotal += itemTotal;
      return {
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: Number(menuItem.price)
      };
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
    const orderItemsData = orderItems.map((item: any) => ({
      ...item,
      order_id: order.id
    }));

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (orderItemsError) {
      console.error('Error creating order items:', orderItemsError);
      // Attempt to clean up the order
      await supabase.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create order items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
