import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  order_id: string;
  message_type: 'order_accepted' | 'order_ready';
}

serve(async (req) => {
  // Handle CORS preflight
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
    const { order_id, message_type }: WhatsAppRequest = await req.json();

    if (!order_id || !message_type) {
      return new Response(
        JSON.stringify({ error: 'order_id and message_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order with customer phone
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        restaurants (
          name
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.customer_phone) {
      console.log('No customer phone for order:', order_id);
      return new Response(
        JSON.stringify({ success: false, message: 'No customer phone number' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if WhatsApp is enabled for this restaurant
    const { data: settings } = await supabase
      .from('restaurant_settings')
      .select('whatsapp_enabled')
      .eq('restaurant_id', order.restaurant_id)
      .single();

    if (!settings?.whatsapp_enabled) {
      console.log('WhatsApp not enabled for restaurant:', order.restaurant_id);
      return new Response(
        JSON.stringify({ success: false, message: 'WhatsApp notifications not enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get WhatsApp credentials
    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const whatsappPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!whatsappToken || !whatsappPhoneId) {
      console.log('WhatsApp credentials not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'WhatsApp not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderNumber = order.id.slice(0, 8).toUpperCase();
    const restaurantName = order.restaurants?.name || 'Restaurant';

    let messageBody = '';
    if (message_type === 'order_accepted') {
      const readyTime = order.estimated_ready_at 
        ? new Date(order.estimated_ready_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : 'soon';
      messageBody = `Hi ${order.customer_name || 'there'}! 🍽️\n\nYour order #${orderNumber} at ${restaurantName} has been accepted!\n\nEstimated ready time: ${readyTime}\n\nThank you for ordering!`;
    } else if (message_type === 'order_ready') {
      messageBody = `Hi ${order.customer_name || 'there'}! ✅\n\nGreat news! Your order #${orderNumber} at ${restaurantName} is ready for pickup!\n\nSee you soon!`;
    }

    // Clean phone number (remove spaces, dashes, ensure country code)
    let phone = order.customer_phone.replace(/[\s\-\(\)]/g, '');
    if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }
    // Remove the + for the API
    phone = phone.replace('+', '');

    // Send WhatsApp message via Meta API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: messageBody },
        }),
      }
    );

    const whatsappResult = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappResult);
      return new Response(
        JSON.stringify({ success: false, error: whatsappResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark customer as notified
    await supabase
      .from('orders')
      .update({ customer_notified: true })
      .eq('id', order_id);

    console.log('WhatsApp message sent successfully:', whatsappResult);

    return new Response(
      JSON.stringify({ success: true, message_id: whatsappResult.messages?.[0]?.id }),
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
