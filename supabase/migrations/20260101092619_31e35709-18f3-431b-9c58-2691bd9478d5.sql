-- Add tax_rate column to menus table for category-based taxation
ALTER TABLE public.menus ADD COLUMN tax_rate NUMERIC DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.menus.tax_rate IS 'Tax rate percentage for items in this menu/category';