import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RestaurantSettings, OpeningHours, DeliveryZone } from '@/types/database';
import type { Json } from '@/integrations/supabase/types';

export function useRestaurantSettings(restaurantId: string) {
  return useQuery({
    queryKey: ['restaurant-settings', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .maybeSingle();
      if (error) throw error;
      return data ? {
        ...data,
        opening_hours: data.opening_hours as unknown as OpeningHours,
        delivery_zones: data.delivery_zones as unknown as DeliveryZone[],
      } as RestaurantSettings : null;
    },
    enabled: !!restaurantId,
  });
}

export function useUpdateRestaurantSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      restaurant_id, 
      ...data 
    }: Partial<RestaurantSettings> & { restaurant_id: string }) => {
      const updateData = {
        ...data,
        opening_hours: data.opening_hours as unknown as Json,
        delivery_zones: data.delivery_zones as unknown as Json,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('restaurant_settings')
        .update(updateData)
        .eq('restaurant_id', restaurant_id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings', variables.restaurant_id] });
    },
  });
}
