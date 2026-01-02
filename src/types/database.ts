export type AppRole = 'admin' | 'restaurant_owner';
export type PlanType = 'starter' | 'growth' | 'pro';
export type DiscountType = 'menu' | 'item' | 'coupon';
export type DiscountValueType = 'percentage' | 'flat';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type OrderStatus = 'new' | 'accepted' | 'ready' | 'completed';

export interface DayHours {
  open: string;
  close: string;
  is_open: boolean;
}

export interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DeliveryZone {
  name: string;
  fee: number;
  min_order: number;
  polygon?: [number, number][]; // Array of [lng, lat] coordinates
}

export interface RestaurantSettings {
  id: string;
  restaurant_id: string;
  opening_hours: OpeningHours;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  minimum_order_value: number;
  delivery_charge: number;
  delivery_zones: DeliveryZone[];
  preparation_time_minutes: number;
  tax_included_in_price: boolean;
  tax_rate: number;
  whatsapp_enabled?: boolean;
  whatsapp_business_phone?: string;
  created_at: string;
  updated_at: string;
}

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
  tax_rate?: number;
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
  estimated_ready_at: string | null;
  customer_notified: boolean;
  customer_name?: string | null;
  customer_phone?: string | null;
  order_type?: string;
  delivery_address?: string | null;
  delivery_fee?: number;
  tax_amount?: number;
  tax_breakdown?: { name: string; rate: number; amount: number }[];
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
