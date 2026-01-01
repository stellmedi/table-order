import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Clock, Check, ChefHat, Bell, Package } from 'lucide-react';
import type { Order, OrderStatus } from '@/types/database';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: string, status: OrderStatus, estimatedMinutes?: number) => void;
}

const ESTIMATED_TIMES = [15, 20, 30, 45, 60];

export function OrderCard({ order, onUpdateStatus }: OrderCardProps) {
  const [showTimeDialog, setShowTimeDialog] = useState(false);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getElapsedTime = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 min ago';
    return `${diffMinutes} mins ago`;
  };

  const handleAccept = () => {
    setShowTimeDialog(true);
  };

  const handleSelectTime = (minutes: number) => {
    onUpdateStatus(order.id, 'accepted', minutes);
    setShowTimeDialog(false);
  };

  const getEstimatedReadyTime = () => {
    if (!order.estimated_ready_at) return null;
    return new Date(order.estimated_ready_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Card className={`animate-scale-in ${order.status === 'new' ? 'ring-2 ring-warning animate-pulse' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">#{order.id.slice(0, 8).toUpperCase()}</CardTitle>
            <div className="text-right">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(order.created_at)}
              </span>
              <span className="text-xs text-muted-foreground">
                {getElapsedTime(order.created_at)}
              </span>
            </div>
          </div>
          {order.estimated_ready_at && (
            <Badge variant="outline" className="w-fit mt-2">
              <Bell className="h-3 w-3 mr-1" />
              Ready by {getEstimatedReadyTime()}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            {order.order_items?.map((item) => (
              <div key={item.id} className="text-sm">
                <div className="flex justify-between font-medium">
                  <span>
                    {item.quantity}x {item.menu_item?.name || 'Unknown Item'}
                  </span>
                  <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
                {item.variations && item.variations.length > 0 && (
                  <div className="text-xs text-muted-foreground ml-4">
                    {item.variations.map(v => v.variation_name).join(', ')}
                  </div>
                )}
                {item.addons && item.addons.length > 0 && (
                  <div className="text-xs text-accent ml-4">
                    + {item.addons.map(a => `${a.addon_name}${a.quantity > 1 ? ` x${a.quantity}` : ''}`).join(', ')}
                  </div>
                )}
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
                variant="default"
                className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground"
                onClick={handleAccept}
              >
                <Check className="h-5 w-5 mr-2" />
                Accept
              </Button>
            )}
            {order.status === 'accepted' && (
              <Button
                variant="default"
                className="flex-1 bg-info hover:bg-info/90"
                onClick={() => onUpdateStatus(order.id, 'ready')}
              >
                <ChefHat className="h-5 w-5 mr-2" />
                Mark Ready
              </Button>
            )}
            {order.status === 'ready' && (
              <Button
                variant="default"
                className="flex-1 bg-accent hover:bg-accent/90"
                onClick={() => onUpdateStatus(order.id, 'completed')}
              >
                <Package className="h-5 w-5 mr-2" />
                Complete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showTimeDialog} onOpenChange={setShowTimeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Estimated Time</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {ESTIMATED_TIMES.map((mins) => (
              <Button
                key={mins}
                variant="outline"
                className="h-16 text-lg"
                onClick={() => handleSelectTime(mins)}
              >
                {mins} mins
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTimeDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
