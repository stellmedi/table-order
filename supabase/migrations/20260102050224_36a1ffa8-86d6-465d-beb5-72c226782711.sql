-- Add named taxes table for multiple taxes per restaurant
CREATE TABLE public.restaurant_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_taxes ENABLE ROW LEVEL SECURITY;

-- Owners can manage their taxes
CREATE POLICY "Owners can manage their taxes"
ON public.restaurant_taxes
FOR ALL
USING (owns_restaurant(auth.uid(), restaurant_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Public can view active taxes
CREATE POLICY "Public can view active taxes"
ON public.restaurant_taxes
FOR SELECT
USING (is_active = true);

-- Add customer info and order type to orders table
ALTER TABLE public.orders
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_phone TEXT,
ADD COLUMN order_type TEXT DEFAULT 'pickup',
ADD COLUMN delivery_address TEXT,
ADD COLUMN delivery_fee NUMERIC DEFAULT 0,
ADD COLUMN tax_amount NUMERIC DEFAULT 0,
ADD COLUMN tax_breakdown JSONB DEFAULT '[]'::jsonb;

-- Add WhatsApp settings to restaurant_settings
ALTER TABLE public.restaurant_settings
ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT false,
ADD COLUMN whatsapp_business_phone TEXT;