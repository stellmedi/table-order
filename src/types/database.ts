export type AppRole = 'admin' | 'restaurant_owner';
export type PlanType = 'starter' | 'growth' | 'pro';
export type DiscountType = 'menu' | 'item' | 'coupon';
export type DiscountValueType = 'percentage' | 'flat';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type OrderStatus = 'new' | 'accepted' | 'completed';

export interface Profile {
  id: string;
  email: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Restaurant {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  plan: PlanType;
  is_active: boolean;
  created_at: string;
}

export interface Menu {
  id: string;
  restaurant_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  menu_id: string;
  name: string;
  price: number;
  is_available: boolean;
  created_at: string;
  variations?: MenuItemVariation[];
  addons?: MenuItemAddon[];
}

export interface MenuItemVariation {
  id: string;
  menu_item_id: string;
  name: string;
  price_adjustment: number;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export interface MenuItemAddon {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export interface Discount {
  id: string;
  restaurant_id: string;
  type: DiscountType;
  value_type: DiscountValueType;
  value: number;
  menu_id: string | null;
  menu_item_id: string | null;
  coupon_code: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  name_or_number: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export interface TableBooking {
  id: string;
  restaurant_id: string;
  table_id: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  created_at: string;
  table?: RestaurantTable;
}

export interface Order {
  id: string;
  restaurant_id: string;
  status: OrderStatus;
  total: number;
  coupon_code: string | null;
  discount_applied: number;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  created_at: string;
  menu_item?: MenuItem;
  variations?: OrderItemVariation[];
  addons?: OrderItemAddon[];
}

export interface OrderItemVariation {
  id: string;
  order_item_id: string;
  variation_id: string;
  variation_name: string;
  price_adjustment: number;
  created_at: string;
}

export interface OrderItemAddon {
  id: string;
  order_item_id: string;
  addon_id: string;
  addon_name: string;
  price: number;
  quantity: number;
  created_at: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedVariation?: MenuItemVariation;
  selectedAddons?: { addon: MenuItemAddon; quantity: number }[];
}
