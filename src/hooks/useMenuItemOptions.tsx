import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MenuItemVariation, MenuItemAddon } from '@/types/database';

// Variations hooks
export function useVariations(menuItemId: string) {
  return useQuery({
    queryKey: ['variations', menuItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_item_variations')
        .select('*')
        .eq('menu_item_id', menuItemId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as MenuItemVariation[];
    },
    enabled: !!menuItemId,
  });
}

export function useCreateVariation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      menu_item_id: string;
      name: string;
      price_adjustment: number;
      sort_order?: number;
    }) => {
      const { data: variation, error } = await supabase
        .from('menu_item_variations')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return variation as MenuItemVariation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['variations', variables.menu_item_id] });
    },
  });
}

export function useUpdateVariation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, menu_item_id, ...data }: Partial<MenuItemVariation> & { id: string; menu_item_id: string }) => {
      const { error } = await supabase
        .from('menu_item_variations')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['variations', variables.menu_item_id] });
    },
  });
}

export function useDeleteVariation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, menu_item_id }: { id: string; menu_item_id: string }) => {
      const { error } = await supabase
        .from('menu_item_variations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['variations', variables.menu_item_id] });
    },
  });
}

// Addons hooks
export function useAddons(menuItemId: string) {
  return useQuery({
    queryKey: ['addons', menuItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_item_addons')
        .select('*')
        .eq('menu_item_id', menuItemId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as MenuItemAddon[];
    },
    enabled: !!menuItemId,
  });
}

export function useCreateAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      menu_item_id: string;
      name: string;
      price: number;
      sort_order?: number;
    }) => {
      const { data: addon, error } = await supabase
        .from('menu_item_addons')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return addon as MenuItemAddon;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addons', variables.menu_item_id] });
    },
  });
}

export function useUpdateAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, menu_item_id, ...data }: Partial<MenuItemAddon> & { id: string; menu_item_id: string }) => {
      const { error } = await supabase
        .from('menu_item_addons')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addons', variables.menu_item_id] });
    },
  });
}

export function useDeleteAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, menu_item_id }: { id: string; menu_item_id: string }) => {
      const { error } = await supabase
        .from('menu_item_addons')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addons', variables.menu_item_id] });
    },
  });
}
