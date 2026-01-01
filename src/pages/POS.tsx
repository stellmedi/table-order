import { DashboardLayout } from '@/components/Layout';
import { useRestaurants, useOrders } from '@/hooks/useRestaurant';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrderColumn } from '@/components/pos/OrderColumn';
import { useState } from 'react';
import type { Order, OrderStatus } from '@/types/database';

export default function POS() {
  const { data: restaurants } = useRestaurants();
  const restaurant = restaurants?.[0];
  const { data: orders, isLoading, dataUpdatedAt } = useOrders(restaurant?.id || '');
  const { playNotificationSound } = useRealtimeOrders(restaurant?.id || '');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const updateOrderMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      estimated_ready_at 
    }: { 
      id: string; 
      status: OrderStatus; 
      estimated_ready_at?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (estimated_ready_at) {
        updateData.estimated_ready_at = estimated_ready_at;
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', restaurant?.id] });
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['orders', restaurant?.id] });
    toast({ title: 'Orders refreshed' });
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus, estimatedMinutes?: number) => {
    if (!restaurant) return;
    try {
      let estimated_ready_at: string | undefined;
      if (estimatedMinutes) {
        const readyTime = new Date();
        readyTime.setMinutes(readyTime.getMinutes() + estimatedMinutes);
        estimated_ready_at = readyTime.toISOString();
      }

      await updateOrderMutation.mutateAsync({ id, status, estimated_ready_at });
      
      const statusMessages: Record<OrderStatus, { title: string; description: string }> = {
        'new': { title: 'Order received', description: 'New order added' },
        'accepted': { title: 'Order accepted', description: `Ready in ~${estimatedMinutes} mins` },
        'ready': { title: 'Order ready', description: 'Customer can pick up' },
        'completed': { title: 'Order completed', description: 'Great job!' },
      };
      
      toast(statusMessages[status]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleTestSound = () => {
    playNotificationSound();
  };

  const newOrders = orders?.filter((o) => o.status === 'new') || [];
  const acceptedOrders = orders?.filter((o) => o.status === 'accepted') || [];
  const readyOrders = orders?.filter((o) => o.status === 'ready') || [];
  const completedOrders = orders?.filter((o) => o.status === 'completed').slice(0, 10) || [];

  if (!restaurant) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Please create a restaurant first.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        <div className="p-4 border-b border-border bg-card flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Live Orders</h1>
              <p className="text-xs text-muted-foreground">
                Updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleTestSound} 
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              Test Sound
            </Button>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 p-4 flex gap-4 overflow-x-auto">
            <OrderColumn
              title="Pending"
              orders={newOrders}
              status="new"
              onUpdateStatus={handleUpdateStatus}
            />
            <OrderColumn
              title="Preparing"
              orders={acceptedOrders}
              status="accepted"
              onUpdateStatus={handleUpdateStatus}
            />
            <OrderColumn
              title="Ready"
              orders={readyOrders}
              status="ready"
              onUpdateStatus={handleUpdateStatus}
            />
            <OrderColumn
              title="Completed"
              orders={completedOrders}
              status="completed"
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
