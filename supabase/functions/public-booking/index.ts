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
    const body = await req.json();
    const { restaurant_id, table_id, customer_name, customer_phone, booking_date, booking_time } = body;

    // Validate required fields
    if (!restaurant_id || !table_id || !customer_name || !customer_phone || !booking_date || !booking_time) {
      console.error('Missing required fields:', { restaurant_id, table_id, customer_name, customer_phone, booking_date, booking_time });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: restaurant_id, table_id, customer_name, customer_phone, booking_date, booking_time' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating booking for restaurant ${restaurant_id}, table ${table_id}`);

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
      console.error('Restaurant not found or inactive:', restaurantError);
      return new Response(
        JSON.stringify({ error: 'Restaurant not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify table exists and is active
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('id, name_or_number, capacity')
      .eq('id', table_id)
      .eq('restaurant_id', restaurant_id)
      .eq('is_active', true)
      .maybeSingle();

    if (tableError || !table) {
      console.error('Table not found or inactive:', tableError);
      return new Response(
        JSON.stringify({ error: 'Table not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing bookings at the same time (within 2 hours)
    const { data: existingBookings, error: existingError } = await supabase
      .from('table_bookings')
      .select('id')
      .eq('table_id', table_id)
      .eq('booking_date', booking_date)
      .eq('booking_time', booking_time)
      .neq('status', 'cancelled');

    if (existingError) {
      console.error('Error checking existing bookings:', existingError);
    }

    if (existingBookings && existingBookings.length > 0) {
      return new Response(
        JSON.stringify({ error: 'This table is already booked for the selected time' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('table_bookings')
      .insert({
        restaurant_id,
        table_id,
        customer_name,
        customer_phone,
        booking_date,
        booking_time,
        status: 'pending'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Failed to create booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Booking created successfully: ${booking.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking.id,
          table_name: table.name_or_number,
          restaurant_name: restaurant.name,
          booking_date,
          booking_time,
          customer_name,
          status: 'pending'
        }
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
