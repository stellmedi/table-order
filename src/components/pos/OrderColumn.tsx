import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrderCard } from './OrderCard';
import type { Order, OrderStatus } from '@/types/database';

interface OrderColumnProps {
  title: string;
  orders: Order[];
  status: OrderStatus;
  onUpdateStatus: (id: string, status: OrderStatus, estimatedMinutes?: number) => void;
}

export function OrderColumn({ title, orders, status, onUpdateStatus }: OrderColumnProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'new': return 'bg-warning/10 border-warning/30';
      case 'accepted': return 'bg-info/10 border-info/30';
      case 'ready': return 'bg-primary/10 border-primary/30';
      case 'completed': return 'bg-accent/10 border-accent/30';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'new': return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
      case 'accepted': return <Badge className="bg-info">Preparing</Badge>;
      case 'ready': return <Badge className="bg-primary">Ready</Badge>;
      case 'completed': return <Badge className="bg-accent">Completed</Badge>;
    }
  };

  return (
    <div className={`flex-1 min-w-[280px] rounded-xl border-2 ${getStatusColor()} p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <span className="text-muted-foreground font-medium">({orders.length})</span>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-4 pr-2">
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
