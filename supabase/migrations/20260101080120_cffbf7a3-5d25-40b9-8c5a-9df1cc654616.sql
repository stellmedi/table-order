-- Create menu item variations table (e.g., sizes, spice levels)
CREATE TABLE public.menu_item_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Small", "Medium", "Large" or "Mild", "Medium", "Hot"
  price_adjustment NUMERIC NOT NULL DEFAULT 0, -- Additional cost (can be negative for smaller sizes)
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu item add-ons table (e.g., extra cheese, toppings)
CREATE TABLE public.menu_item_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Extra Cheese", "Bacon"
  price NUMERIC NOT NULL DEFAULT 0, -- Additional cost for the add-on
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order item variations table to track selected variation per order item
CREATE TABLE public.order_item_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  variation_id UUID NOT NULL REFERENCES public.menu_item_variations(id),
  variation_name TEXT NOT NULL, -- Snapshot of name at order time
  price_adjustment NUMERIC NOT NULL DEFAULT 0, -- Snapshot of price at order time
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order item add-ons table to track selected add-ons per order item
CREATE TABLE public.order_item_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.menu_item_addons(id),
  addon_name TEXT NOT NULL, -- Snapshot of name at order time
  price NUMERIC NOT NULL DEFAULT 0, -- Snapshot of price at order time
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.menu_item_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_addons ENABLE ROW LEVEL SECURITY;

-- RLS policies for menu_item_variations
CREATE POLICY "Owners can manage their item variations"
ON public.menu_item_variations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM menu_items mi
    JOIN menus m ON m.id = mi.menu_id
    WHERE mi.id = menu_item_variations.menu_item_id
    AND (owns_restaurant(auth.uid(), m.restaurant_id) OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Public can view available variations"
ON public.menu_item_variations
FOR SELECT
USING (
  is_available = true AND
  EXISTS (
    SELECT 1 FROM menu_items mi
    JOIN menus m ON m.id = mi.menu_id
    WHERE mi.id = menu_item_variations.menu_item_id
    AND m.is_active = true AND mi.is_available = true
  )
);

-- RLS policies for menu_item_addons
CREATE POLICY "Owners can manage their item addons"
ON public.menu_item_addons
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM menu_items mi
    JOIN menus m ON m.id = mi.menu_id
    WHERE mi.id = menu_item_addons.menu_item_id
    AND (owns_restaurant(auth.uid(), m.restaurant_id) OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Public can view available addons"
ON public.menu_item_addons
FOR SELECT
USING (
  is_available = true AND
  EXISTS (
    SELECT 1 FROM menu_items mi
    JOIN menus m ON m.id = mi.menu_id
    WHERE mi.id = menu_item_addons.menu_item_id
    AND m.is_active = true AND mi.is_available = true
  )
);

-- RLS policies for order_item_variations
CREATE POLICY "Owners can view their order item variations"
ON public.order_item_variations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_variations.order_item_id
    AND (owns_restaurant(auth.uid(), o.restaurant_id) OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Public can create order item variations"
ON public.order_item_variations
FOR INSERT
WITH CHECK (true);

-- RLS policies for order_item_addons
CREATE POLICY "Owners can view their order item addons"
ON public.order_item_addons
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_addons.order_item_id
    AND (owns_restaurant(auth.uid(), o.restaurant_id) OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Public can create order item addons"
ON public.order_item_addons
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_menu_item_variations_menu_item_id ON public.menu_item_variations(menu_item_id);
CREATE INDEX idx_menu_item_addons_menu_item_id ON public.menu_item_addons(menu_item_id);
CREATE INDEX idx_order_item_variations_order_item_id ON public.order_item_variations(order_item_id);
CREATE INDEX idx_order_item_addons_order_item_id ON public.order_item_addons(order_item_id);