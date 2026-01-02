import { forwardRef } from 'react';
import type { Order } from '@/types/database';

interface TaxBreakdown {
  name: string;
  rate: number;
  amount: number;
}

interface OrderReceiptProps {
  order: Order;
  restaurantName: string;
  taxes?: TaxBreakdown[];
}

export const OrderReceipt = forwardRef<HTMLDivElement, OrderReceiptProps>(
  ({ order, restaurantName, taxes = [] }, ref) => {
    const orderNumber = order.id.slice(0, 8).toUpperCase();
    const orderDate = new Date(order.created_at);

    // Calculate subtotal from items
    const subtotal = order.order_items?.reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity;
    }, 0) || 0;

    // Parse tax breakdown from order if available
    const taxBreakdown: TaxBreakdown[] = taxes.length > 0 
      ? taxes 
      : (order.tax_breakdown as TaxBreakdown[] || []);

    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-4 font-mono text-sm print:p-0"
        style={{ width: '80mm', maxWidth: '100%' }}
      >
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          <h1 className="text-xl font-bold uppercase">{restaurantName}</h1>
          <p className="text-xs text-gray-600 mt-1">Order Receipt</p>
        </div>

        {/* Order Info */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <div className="flex justify-between">
            <span>Order #:</span>
            <span className="font-bold">{orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{orderDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span>{orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {order.order_type && (
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="uppercase">{order.order_type}</span>
            </div>
          )}
        </div>

        {/* Customer Info */}
        {(order.customer_name || order.customer_phone) && (
          <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
            {order.customer_name && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{order.customer_name}</span>
              </div>
            )}
            {order.customer_phone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{order.customer_phone}</span>
              </div>
            )}
            {order.delivery_address && (
              <div className="mt-1">
                <span>Delivery:</span>
                <p className="text-xs">{order.delivery_address}</p>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <div className="font-bold mb-2 uppercase text-xs">Items</div>
          {order.order_items?.map((item) => (
            <div key={item.id} className="mb-2">
              <div className="flex justify-between">
                <span>{item.quantity}x {item.menu_item?.name || 'Item'}</span>
                <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
              </div>
              {item.variations && item.variations.length > 0 && (
                <div className="text-xs text-gray-600 ml-3">
                  → {item.variations.map(v => v.variation_name).join(', ')}
                </div>
              )}
              {item.addons && item.addons.length > 0 && (
                <div className="text-xs text-gray-600 ml-3">
                  + {item.addons.map(a => 
                    `${a.addon_name}${a.quantity > 1 ? ` x${a.quantity}` : ''}`
                  ).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          
          {Number(order.discount_applied) > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Discount:</span>
              <span>-${Number(order.discount_applied).toFixed(2)}</span>
            </div>
          )}

          {/* Tax breakdown */}
          {taxBreakdown.map((tax, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span>{tax.name} ({tax.rate}%):</span>
              <span>${tax.amount.toFixed(2)}</span>
            </div>
          ))}

          {Number(order.tax_amount) > 0 && taxBreakdown.length === 0 && (
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${Number(order.tax_amount).toFixed(2)}</span>
            </div>
          )}

          {Number(order.delivery_fee) > 0 && (
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span>${Number(order.delivery_fee).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-lg border-t border-gray-400 pt-2 mt-2">
            <span>TOTAL:</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-400">
          <p className="text-xs">Thank you for your order!</p>
          <p className="text-xs text-gray-500 mt-1">Please pay at counter</p>
        </div>

        {/* Kitchen Notes (only shown on print) */}
        <div className="mt-4 pt-3 border-t border-dashed border-gray-400 print:block hidden">
          <div className="font-bold text-xs uppercase mb-2">Kitchen Copy</div>
          {order.order_items?.map((item) => (
            <div key={item.id} className="mb-1">
              <span className="font-bold">{item.quantity}x</span> {item.menu_item?.name}
              {item.variations && item.variations.length > 0 && (
                <span className="text-xs"> ({item.variations.map(v => v.variation_name).join(', ')})</span>
              )}
              {item.addons && item.addons.length > 0 && (
                <span className="text-xs"> +{item.addons.map(a => a.addon_name).join(', ')}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

OrderReceipt.displayName = 'OrderReceipt';
