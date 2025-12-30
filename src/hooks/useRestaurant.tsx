import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Restaurant, Menu, MenuItem, Discount, RestaurantTable, TableBooking, Order, PlanType, DiscountType, DiscountValueType, BookingStatus, OrderStatus } from '@/types/database';

export function useRestaurants() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['restaurants', user?.id, role],
    queryFn: async () => {
      if (role === 'admin') {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Restaurant[];
      } else {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', user?.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Restaurant[];
      }
    },
    enabled: !!user,
  });
}

export function useRestaurantBySlug(slug: string) {
  return useQuery({
    queryKey: ['restaurant', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as Restaurant | null;
    },
    enabled: !!slug,
  });
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; slug: string; owner_id?: string; plan?: PlanType }) => {
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return restaurant as Restaurant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Restaurant> & { id: string }) => {
      const { error } = await supabase
        .from('restaurants')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

export function useMenus(restaurantId: string) {
  return useQuery({
    queryKey: ['menus', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Menu[];
    },
    enabled: !!restaurantId,
  });
}

export function usePublicMenus(restaurantId: string) {
  return useQuery({
    queryKey: ['public-menus', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menus')
        .select('*, menu_items(*)')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (Menu & { menu_items: MenuItem[] })[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { restaurant_id: string; name: string }) => {
      const { data: menu, error } = await supabase
        .from('menus')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return menu as Menu;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menus', variables.restaurant_id] });
    },
  });
}

export function useUpdateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurant_id, ...data }: Partial<Menu> & { id: string; restaurant_id: string }) => {
      const { error } = await supabase
        .from('menus')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menus', variables.restaurant_id] });
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurant_id }: { id: string; restaurant_id: string }) => {
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menus', variables.restaurant_id] });
    },
  });
}

export function useMenuItems(menuId: string) {
  return useQuery({
    queryKey: ['menu-items', menuId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', menuId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!menuId,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { menu_id: string; name: string; price: number }) => {
      const { data: item, error } = await supabase
        .from('menu_items')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return item as MenuItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', variables.menu_id] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, menu_id, ...data }: Partial<MenuItem> & { id: string; menu_id: string }) => {
      const { error } = await supabase
        .from('menu_items')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', variables.menu_id] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, menu_id }: { id: string; menu_id: string }) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', variables.menu_id] });
    },
  });
}

export function useDiscounts(restaurantId: string) {
  return useQuery({
    queryKey: ['discounts', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Discount[];
    },
    enabled: !!restaurantId,
  });
}

export function usePublicDiscounts(restaurantId: string) {
  return useQuery({
    queryKey: ['public-discounts', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);
      if (error) throw error;
      return data as Discount[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      restaurant_id: string;
      type: DiscountType;
      value_type: DiscountValueType;
      value: number;
      menu_id?: string;
      menu_item_id?: string;
      coupon_code?: string;
    }) => {
      const { data: discount, error } = await supabase
        .from('discounts')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return discount as Discount;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discounts', variables.restaurant_id] });
    },
  });
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurant_id, ...data }: Partial<Discount> & { id: string; restaurant_id: string }) => {
      const { error } = await supabase
        .from('discounts')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discounts', variables.restaurant_id] });
    },
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurant_id }: { id: string; restaurant_id: string }) => {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discounts', variables.restaurant_id] });
    },
  });
}

export function useTables(restaurantId: string) {
  return useQuery({
    queryKey: ['tables', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name_or_number', { ascending: true });
      if (error) throw error;
      return data as RestaurantTable[];
    },
    enabled: !!restaurantId,
  });
}

export function usePublicTables(restaurantId: string) {
  return useQuery({
    queryKey: ['public-tables', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('name_or_number', { ascending: true });
      if (error) throw error;
      return data as RestaurantTable[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { restaurant_id: string; name_or_number: string; capacity: number }) => {
      const { data: table, error } = await supabase
        .from('tables')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return table as RestaurantTable;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tables', variables.restaurant_id] });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurant_id, ...data }: Partial<RestaurantTable> & { id: string; restaurant_id: string }) => {
      const { error } = await supabase
        .from('tables')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tables', variables.restaurant_id] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurant_id }: { id: string; restaurant_id: string }) => {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tables', variables.restaurant_id] });
    },
  });
}

export function useBookings(restaurantId: string) {
  return useQuery({
    queryKey: ['bookings', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_bookings')
        .select('*, table:tables(*)')
        .eq('restaurant_id', restaurantId)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });
      if (error) throw error;
      return data as TableBooking[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      restaurant_id: string;
      table_id: string;
      customer_name: string;
      customer_phone: string;
      booking_date: string;
      booking_time: string;
    }) => {
      const { data: booking, error } = await supabase
        .from('table_bookings')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return booking as TableBooking;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', variables.restaurant_id] });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurant_id, status }: { id: string; restaurant_id: string; status: BookingStatus }) => {
      const { error } = await supabase
        .from('table_bookings')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', variables.restaurant_id] });
    },
  });
}

export function useOrders(restaurantId: string) {
  return useQuery({
    queryKey: ['orders', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_item:menu_items(*))')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!restaurantId,
    refetchInterval: 10000,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (data: {
      restaurant_id: string;
      total: number;
      coupon_code?: string;
      discount_applied?: number;
      items: { menu_item_id: string; quantity: number; price: number }[];
    }) => {
      const { items, ...orderData } = data;
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        ...item,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order as Order;
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurant_id, status }: { id: string; restaurant_id: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', variables.restaurant_id] });
    },
  });
}
