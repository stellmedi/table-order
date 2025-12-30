-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'restaurant_owner');

-- Create plan type enum
CREATE TYPE public.plan_type AS ENUM ('starter', 'growth', 'pro');

-- Create discount type enum
CREATE TYPE public.discount_type AS ENUM ('menu', 'item', 'coupon');

-- Create discount value type enum
CREATE TYPE public.discount_value_type AS ENUM ('percentage', 'flat');

-- Create booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('new', 'accepted', 'completed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan plan_type DEFAULT 'starter' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create menus table
CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  is_available BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create discounts table
CREATE TABLE public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  type discount_type NOT NULL,
  value_type discount_value_type NOT NULL,
  value NUMERIC(10,2) NOT NULL,
  menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  coupon_code TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tables table
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name_or_number TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create table_bookings table
CREATE TABLE public.table_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status booking_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  status order_status DEFAULT 'new' NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  coupon_code TEXT,
  discount_applied NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check restaurant ownership
CREATE OR REPLACE FUNCTION public.owns_restaurant(_user_id UUID, _restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurants
    WHERE id = _restaurant_id
      AND owner_id = _user_id
  )
$$;

-- Create trigger for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for restaurants
CREATE POLICY "Admins can view all restaurants"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can view their restaurants"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Public can view active restaurants"
  ON public.restaurants FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Admins can manage all restaurants"
  ON public.restaurants FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can manage their restaurants"
  ON public.restaurants FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

-- RLS Policies for menus
CREATE POLICY "Public can view active menus"
  ON public.menus FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can manage their menus"
  ON public.menus FOR ALL
  TO authenticated
  USING (public.owns_restaurant(auth.uid(), restaurant_id) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for menu_items
CREATE POLICY "Public can view available items"
  ON public.menu_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.menus m
    WHERE m.id = menu_id AND m.is_active = true
  ));

CREATE POLICY "Owners can manage their items"
  ON public.menu_items FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.menus m
    WHERE m.id = menu_id
    AND (public.owns_restaurant(auth.uid(), m.restaurant_id) OR public.has_role(auth.uid(), 'admin'))
  ));

-- RLS Policies for discounts
CREATE POLICY "Public can view active discounts"
  ON public.discounts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can manage their discounts"
  ON public.discounts FOR ALL
  TO authenticated
  USING (public.owns_restaurant(auth.uid(), restaurant_id) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tables
CREATE POLICY "Public can view active tables"
  ON public.tables FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can manage their tables"
  ON public.tables FOR ALL
  TO authenticated
  USING (public.owns_restaurant(auth.uid(), restaurant_id) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for table_bookings
CREATE POLICY "Public can create bookings"
  ON public.table_bookings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Owners can view their bookings"
  ON public.table_bookings FOR SELECT
  TO authenticated
  USING (public.owns_restaurant(auth.uid(), restaurant_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can manage their bookings"
  ON public.table_bookings FOR ALL
  TO authenticated
  USING (public.owns_restaurant(auth.uid(), restaurant_id) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for orders
CREATE POLICY "Public can create orders"
  ON public.orders FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Owners can view their orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.owns_restaurant(auth.uid(), restaurant_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can manage their orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.owns_restaurant(auth.uid(), restaurant_id) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for order_items
CREATE POLICY "Public can create order items"
  ON public.order_items FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Owners can view their order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
    AND (public.owns_restaurant(auth.uid(), o.restaurant_id) OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Owners can manage their order items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
    AND (public.owns_restaurant(auth.uid(), o.restaurant_id) OR public.has_role(auth.uid(), 'admin'))
  ));