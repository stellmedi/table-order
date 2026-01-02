import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RestaurantTax {
  id: string;
  restaurant_id: string;
  name: string;
  rate: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export function useRestaurantTaxes(restaurantId: string) {
  return useQuery({
    queryKey: ['restaurant-taxes', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from('restaurant_taxes')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order');
      
      if (error) throw error;
      return data as RestaurantTax[];
    },
    enabled: !!restaurantId,
  });
}

export function usePublicRestaurantTaxes(restaurantId: string) {
  return useQuery({
    queryKey: ['public-restaurant-taxes', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from('restaurant_taxes')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as RestaurantTax[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateRestaurantTax() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tax: Omit<RestaurantTax, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('restaurant_taxes')
        .insert(tax)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-taxes', variables.restaurant_id] });
    },
  });
}

export function useUpdateRestaurantTax() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RestaurantTax> & { id: string; restaurant_id: string }) => {
      const { data, error } = await supabase
        .from('restaurant_taxes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-taxes', variables.restaurant_id] });
    },
  });
}

export function useDeleteRestaurantTax() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, restaurant_id }: { id: string; restaurant_id: string }) => {
      const { error } = await supabase
        .from('restaurant_taxes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-taxes', variables.restaurant_id] });
    },
  });
}
