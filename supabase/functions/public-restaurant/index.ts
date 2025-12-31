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

    // Fetch menus with items
    const { data: menus, error: menusError } = await supabase
      .from('menus')
      .select(`
        id, name, is_active,
        menu_items (id, name, price, is_available)
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

    // Filter to only available items
    const menusWithItems = menus?.map(menu => ({
      ...menu,
      menu_items: menu.menu_items?.filter((item: any) => item.is_available) || []
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
        discounts: discounts || []
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
