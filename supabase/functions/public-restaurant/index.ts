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

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      console.error('Missing slug parameter');
      return new Response(
        JSON.stringify({ error: 'Missing slug parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching restaurant with slug: ${slug}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, slug, is_active')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (restaurantError) {
      console.error('Error fetching restaurant:', restaurantError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch restaurant' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!restaurant) {
      console.log('Restaurant not found');
      return new Response(
        JSON.stringify({ error: 'Restaurant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch restaurant settings
    const { data: settings, error: settingsError } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
    }

    // Fetch restaurant taxes
    const { data: taxes, error: taxesError } = await supabase
      .from('restaurant_taxes')
      .select('id, name, rate, is_active, sort_order')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (taxesError) {
      console.error('Error fetching taxes:', taxesError);
    }

    // Fetch tables for booking
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('id, name_or_number, capacity, is_active')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('name_or_number', { ascending: true });

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
    }

    // Fetch menus with items, variations, and addons
    const { data: menus, error: menusError } = await supabase
      .from('menus')
      .select(`
        id, name, is_active,
        menu_items (
          id, name, price, is_available
        )
      `)
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true);

    if (menusError) {
      console.error('Error fetching menus:', menusError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch menus' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all menu item IDs for fetching variations and addons
    const menuItemIds: string[] = [];
    menus?.forEach(menu => {
      menu.menu_items?.forEach((item: any) => {
        if (item.is_available) {
          menuItemIds.push(item.id);
        }
      });
    });

    // Fetch variations for all menu items
    const { data: variations } = await supabase
      .from('menu_item_variations')
      .select('id, menu_item_id, name, price_adjustment, is_available, sort_order')
      .in('menu_item_id', menuItemIds)
      .eq('is_available', true)
      .order('sort_order', { ascending: true });

    // Fetch addons for all menu items
    const { data: addons } = await supabase
      .from('menu_item_addons')
      .select('id, menu_item_id, name, price, is_available, sort_order')
      .in('menu_item_id', menuItemIds)
      .eq('is_available', true)
      .order('sort_order', { ascending: true });

    // Create lookup maps
    const variationsByItem = new Map<string, any[]>();
    const addonsByItem = new Map<string, any[]>();

    variations?.forEach(v => {
      if (!variationsByItem.has(v.menu_item_id)) {
        variationsByItem.set(v.menu_item_id, []);
      }
      variationsByItem.get(v.menu_item_id)!.push(v);
    });

    addons?.forEach(a => {
      if (!addonsByItem.has(a.menu_item_id)) {
        addonsByItem.set(a.menu_item_id, []);
      }
      addonsByItem.get(a.menu_item_id)!.push(a);
    });

    // Filter to only available items and attach variations/addons
    const menusWithItems = menus?.map(menu => ({
      ...menu,
      menu_items: menu.menu_items
        ?.filter((item: any) => item.is_available)
        .map((item: any) => ({
          ...item,
          variations: variationsByItem.get(item.id) || [],
          addons: addonsByItem.get(item.id) || []
        })) || []
    })) || [];

    // Fetch active coupon discounts
    const { data: discounts, error: discountsError } = await supabase
      .from('discounts')
      .select('id, coupon_code, type, value_type, value, is_active')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .eq('type', 'coupon');

    if (discountsError) {
      console.error('Error fetching discounts:', discountsError);
    }

    console.log(`Successfully fetched data for restaurant: ${restaurant.name}`);

    return new Response(
      JSON.stringify({
        restaurant,
        menus: menusWithItems,
        discounts: discounts || [],
        settings: settings || null,
        taxes: taxes || [],
        tables: tables || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
