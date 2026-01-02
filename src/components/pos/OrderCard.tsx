import { useState, useRef } from 'react';
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
import { Clock, Check, ChefHat, Bell, Package, Printer } from 'lucide-react';
import { OrderReceipt } from '@/components/OrderReceipt';
import type { Order, OrderStatus } from '@/types/database';

interface OrderCardProps {
  order: Order;
  restaurantName?: string;
  onUpdateStatus: (id: string, status: OrderStatus, estimatedMinutes?: number) => void;
}

const ESTIMATED_TIMES = [15, 20, 30, 45, 60];

export function OrderCard({ order, restaurantName = 'Restaurant', onUpdateStatus }: OrderCardProps) {
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = () => {
    setShowReceiptDialog(true);
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !receiptRef.current) return;

    const receiptHtml = receiptRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Receipt</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              margin: 0;
              padding: 10px;
              width: 80mm;
            }
            * { box-sizing: border-box; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .text-xl { font-size: 16px; }
            .text-lg { font-size: 14px; }
            .text-sm { font-size: 11px; }
            .text-xs { font-size: 10px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-3 { margin-bottom: 12px; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .mt-4 { margin-top: 16px; }
            .pt-2 { padding-top: 8px; }
            .pt-3 { padding-top: 12px; }
            .pb-3 { padding-bottom: 12px; }
            .ml-3 { margin-left: 12px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .border-t { border-top: 1px solid #ccc; }
            .border-b { border-bottom: 1px solid #ccc; }
            .border-dashed { border-style: dashed; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .text-gray-600 { color: #666; }
            .text-gray-500 { color: #888; }
            .text-green-700 { color: #15803d; }
            @media print {
              body { margin: 0; padding: 5px; }
            }
          </style>
        </head>
        <body>
          ${receiptHtml}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    
    setShowReceiptDialog(false);
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
          <div className="flex items-center gap-2 mt-2">
            {order.estimated_ready_at && (
              <Badge variant="outline">
                <Bell className="h-3 w-3 mr-1" />
                Ready by {getEstimatedReadyTime()}
              </Badge>
            )}
            {order.order_type && (
              <Badge variant="secondary" className="uppercase text-xs">
                {order.order_type}
              </Badge>
            )}
          </div>
          {order.customer_name && (
            <p className="text-sm mt-1">
              <span className="font-medium">{order.customer_name}</span>
              {order.customer_phone && <span className="text-muted-foreground"> • {order.customer_phone}</span>}
            </p>
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

          {Number(order.tax_amount) > 0 && (
            <div className="text-sm text-muted-foreground mb-2">
              Tax: ${Number(order.tax_amount).toFixed(2)}
            </div>
          )}

          {Number(order.delivery_fee) > 0 && (
            <div className="text-sm text-muted-foreground mb-2">
              Delivery: ${Number(order.delivery_fee).toFixed(2)}
            </div>
          )}
          
          <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
            <span className="font-semibold text-lg">Total: ${Number(order.total).toFixed(2)}</span>
            <Button variant="ghost" size="icon" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
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

      {/* Time Selection Dialog */}
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

      {/* Receipt Preview Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Receipt</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <OrderReceipt 
              ref={receiptRef} 
              order={order} 
              restaurantName={restaurantName} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              Close
            </Button>
            <Button onClick={printReceipt} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
