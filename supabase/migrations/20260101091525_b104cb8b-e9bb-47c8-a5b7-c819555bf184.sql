-- Add 'ready' status to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'ready' AFTER 'accepted';

-- Add estimated fulfillment time to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_ready_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_notified BOOLEAN DEFAULT false;

-- Create restaurant_settings table
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  opening_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "22:00", "is_open": true},
    "tuesday": {"open": "09:00", "close": "22:00", "is_open": true},
    "wednesday": {"open": "09:00", "close": "22:00", "is_open": true},
    "thursday": {"open": "09:00", "close": "22:00", "is_open": true},
    "friday": {"open": "09:00", "close": "22:00", "is_open": true},
    "saturday": {"open": "10:00", "close": "23:00", "is_open": true},
    "sunday": {"open": "10:00", "close": "21:00", "is_open": true}
  }'::jsonb,
  pickup_enabled BOOLEAN DEFAULT true,
  delivery_enabled BOOLEAN DEFAULT false,
  minimum_order_value NUMERIC DEFAULT 0,
  delivery_charge NUMERIC DEFAULT 0,
  delivery_zones JSONB DEFAULT '[]'::jsonb,
  preparation_time_minutes INTEGER DEFAULT 20,
  tax_included_in_price BOOLEAN DEFAULT true,
  tax_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for restaurant_settings
CREATE POLICY "Owners can manage their settings"
ON public.restaurant_settings FOR ALL
USING (owns_restaurant(auth.uid(), restaurant_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view settings"
ON public.restaurant_settings FOR SELECT
USING (true);

-- Create settings for existing restaurants
INSERT INTO public.restaurant_settings (restaurant_id)
SELECT id FROM public.restaurants
ON CONFLICT (restaurant_id) DO NOTHING;

-- Function to auto-create settings for new restaurants
CREATE OR REPLACE FUNCTION public.create_restaurant_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.restaurant_settings (restaurant_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create settings on restaurant creation
DROP TRIGGER IF EXISTS on_restaurant_created ON public.restaurants;
CREATE TRIGGER on_restaurant_created
AFTER INSERT ON public.restaurants
FOR EACH ROW EXECUTE FUNCTION public.create_restaurant_settings();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;