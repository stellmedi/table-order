import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const NEW_ORDER_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';

export function useRealtimeOrders(restaurantId: string) {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastOrderCountRef = useRef<number>(0);

  const playNotificationSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(NEW_ORDER_SOUND_URL);
      audioRef.current.volume = 0.7;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(console.error);
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('New order received:', payload);
          playNotificationSound();
          queryClient.invalidateQueries({ queryKey: ['orders', restaurantId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient, playNotificationSound]);

  return { playNotificationSound };
}
