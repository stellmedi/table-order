import { DashboardLayout } from '@/components/Layout';
import { useRestaurants, useOrders, useUpdateOrder } from '@/hooks/useRestaurant';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Loader2, RefreshCw, Clock, Check, ChefHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { Order, OrderStatus } from '@/types/database';

function OrderCard({ order, onUpdateStatus }: { order: Order; onUpdateStatus: (id: string, status: OrderStatus) => void }) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Card className="animate-scale-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(order.created_at)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.menu_item?.name || 'Unknown Item'}
              </span>
              <span className="font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        {order.coupon_code && (
          <div className="text-sm text-muted-foreground mb-2">
            Coupon: <span className="font-medium">{order.coupon_code}</span>
            {order.discount_applied && Number(order.discount_applied) > 0 && (
              <span className="text-accent"> (-${Number(order.discount_applied).toFixed(2)})</span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
          <span className="font-semibold text-lg">Total: ${Number(order.total).toFixed(2)}</span>
        </div>

        <div className="mt-4 flex gap-2">
          {order.status === 'new' && (
            <Button
              variant="pos"
              className="flex-1"
              onClick={() => onUpdateStatus(order.id, 'accepted')}
            >
              <Check className="h-5 w-5 mr-2" />
              Accept
            </Button>
          )}
          {order.status === 'accepted' && (
            <Button
              variant="pos-success"
              className="flex-1"
              onClick={() => onUpdateStatus(order.id, 'completed')}
            >
              <ChefHat className="h-5 w-5 mr-2" />
              Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OrderColumn({ title, orders, status, onUpdateStatus }: { 
  title: string; 
  orders: Order[]; 
  status: OrderStatus;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'new': return 'bg-warning/10 border-warning/30';
      case 'accepted': return 'bg-info/10 border-info/30';
      case 'completed': return 'bg-accent/10 border-accent/30';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'new': return <Badge className="bg-warning text-foreground">New</Badge>;
      case 'accepted': return <Badge className="bg-info">In Progress</Badge>;
      case 'completed': return <Badge className="bg-accent">Completed</Badge>;
    }
  };

  return (
    <div className={`flex-1 rounded-xl border-2 ${getStatusColor()} p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <span className="text-muted-foreground">({orders.length})</span>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-4 pr-4">
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No orders</p>
          ) : (
            orders.map((order) => (
              <OrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function POS() {
  const { data: restaurants } = useRestaurants();
  const restaurant = restaurants?.[0];
  const { data: orders, isLoading, dataUpdatedAt } = useOrders(restaurant?.id || '');
  const updateOrder = useUpdateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['orders', restaurant?.id] });
    toast({ title: 'Orders refreshed' });
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    if (!restaurant) return;
    try {
      await updateOrder.mutateAsync({
        id,
        restaurant_id: restaurant.id,
        status,
      });
      toast({ 
        title: status === 'accepted' ? 'Order accepted' : 'Order completed',
        description: status === 'accepted' ? 'The order is now in progress' : 'Great job!',
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const newOrders = orders?.filter((o) => o.status === 'new') || [];
  const acceptedOrders = orders?.filter((o) => o.status === 'accepted') || [];
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
        <div className="p-6 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">POS Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 p-6 flex gap-6 overflow-hidden">
            <OrderColumn
              title="New Orders"
              orders={newOrders}
              status="new"
              onUpdateStatus={handleUpdateStatus}
            />
            <OrderColumn
              title="In Progress"
              orders={acceptedOrders}
              status="accepted"
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
