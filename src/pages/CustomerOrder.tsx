import { useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/Layout';
import { useRestaurantBySlug, usePublicMenus, usePublicDiscounts } from '@/hooks/useRestaurant';
import { usePublicRestaurantTaxes } from '@/hooks/useRestaurantTaxes';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ItemOptionsModal } from '@/components/ItemOptionsModal';
import { OrderReceipt } from '@/components/OrderReceipt';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChefHat, 
  Plus, 
  Minus, 
  ShoppingCart, 
  CalendarDays,
  Loader2,
  Check,
  Tag,
  Truck,
  Store,
  UtensilsCrossed,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CartItem, MenuItem, Discount, MenuItemVariation, MenuItemAddon, DeliveryZone } from '@/types/database';

export default function CustomerOrder() {
  const { slug } = useParams<{ slug: string }>();
  const { data: restaurant, isLoading: loadingRestaurant } = useRestaurantBySlug(slug || '');
  const { data: menus, isLoading: loadingMenus } = usePublicMenus(restaurant?.id || '');
  const { data: discounts } = usePublicDiscounts(restaurant?.id || '');
  const { data: taxes } = usePublicRestaurantTaxes(restaurant?.id || '');
  const { data: settings } = useRestaurantSettings(restaurant?.id || '');
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPinCode, setDeliveryPinCode] = useState('');
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Item options modal
  const [optionsModal, setOptionsModal] = useState<{ open: boolean; item: MenuItem | null }>({
    open: false,
    item: null,
  });

  const handleItemClick = (menuItem: MenuItem) => {
    const hasOptions = (menuItem.variations && menuItem.variations.length > 0) || 
                       (menuItem.addons && menuItem.addons.length > 0);
    
    if (hasOptions) {
      setOptionsModal({ open: true, item: menuItem });
    } else {
      addToCart(menuItem);
    }
  };

  const addToCart = (
    menuItem: MenuItem,
    selectedVariation?: MenuItemVariation,
    selectedAddons?: { addon: MenuItemAddon; quantity: number }[]
  ) => {
    setCart((prev) => {
      // Create a unique key for this cart item configuration
      const configKey = `${menuItem.id}_${selectedVariation?.id || 'no-var'}_${
        selectedAddons?.map(a => `${a.addon.id}:${a.quantity}`).join(',') || 'no-addons'
      }`;

      const existing = prev.find((item) => {
        const itemConfigKey = `${item.menuItem.id}_${item.selectedVariation?.id || 'no-var'}_${
          item.selectedAddons?.map(a => `${a.addon.id}:${a.quantity}`).join(',') || 'no-addons'
        }`;
        return itemConfigKey === configKey;
      });

      if (existing) {
        return prev.map((item) => {
          const itemConfigKey = `${item.menuItem.id}_${item.selectedVariation?.id || 'no-var'}_${
            item.selectedAddons?.map(a => `${a.addon.id}:${a.quantity}`).join(',') || 'no-addons'
          }`;
          return itemConfigKey === configKey
            ? { ...item, quantity: item.quantity + 1 }
            : item;
        });
      }

      return [...prev, { 
        menuItem, 
        quantity: 1, 
        selectedVariation, 
        selectedAddons 
      }];
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => {
      const item = prev[index];
      if (item.quantity > 1) {
        return prev.map((i, idx) => 
          idx === index ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const incrementCartItem = (index: number) => {
    setCart((prev) => 
      prev.map((item, idx) => 
        idx === index ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const getCartQuantity = (menuItemId: string) => {
    return cart
      .filter((item) => item.menuItem.id === menuItemId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Calculate item price with variations and addons
  const calculateItemPrice = (item: CartItem) => {
    let price = Number(item.menuItem.price);
    if (item.selectedVariation) {
      price += Number(item.selectedVariation.price_adjustment);
    }
    if (item.selectedAddons) {
      item.selectedAddons.forEach(({ addon, quantity }) => {
        price += Number(addon.price) * quantity;
      });
    }
    return price * item.quantity;
  };

  const subtotal = cart.reduce((sum, item) => sum + calculateItemPrice(item), 0);

  const applyCoupon = () => {
    if (!couponCode.trim()) return;
    
    const coupon = discounts?.find(
      (d) => d.type === 'coupon' && d.coupon_code?.toUpperCase() === couponCode.toUpperCase().trim()
    );
    
    if (coupon) {
      setAppliedDiscount(coupon);
      toast({ title: 'Coupon applied!', description: `${coupon.value}${coupon.value_type === 'percentage' ? '%' : '$'} off` });
    } else {
      toast({ title: 'Invalid coupon', description: 'This coupon code is not valid', variant: 'destructive' });
    }
  };

  const calculateDiscount = () => {
    if (!appliedDiscount) {
      const menuDiscount = discounts?.find((d) => d.type === 'menu' && d.is_active);
      if (menuDiscount) {
        if (menuDiscount.value_type === 'percentage') {
          return subtotal * (Number(menuDiscount.value) / 100);
        }
        return Number(menuDiscount.value);
      }
      return 0;
    }

    if (appliedDiscount.value_type === 'percentage') {
      return subtotal * (Number(appliedDiscount.value) / 100);
    }
    return Math.min(Number(appliedDiscount.value), subtotal);
  };

  const discount = calculateDiscount();
  const afterDiscount = subtotal - discount;

  // Calculate taxes (category-level + restaurant-level)
  const taxBreakdown = useMemo(() => {
    const breakdown: { name: string; rate: number; amount: number }[] = [];
    
    // 1. Category-level taxes (from menu.tax_rate)
    menus?.forEach(menu => {
      if (menu.tax_rate && Number(menu.tax_rate) > 0) {
        let menuItemsTotal = 0;
        
        cart.forEach(cartItem => {
          const menuItem = menu.menu_items?.find(i => i.id === cartItem.menuItem.id);
          if (menuItem) {
            menuItemsTotal += calculateItemPrice(cartItem);
          }
        });
        
        if (menuItemsTotal > 0) {
          // Apply discount proportionally
          const discountRatio = subtotal > 0 ? menuItemsTotal / subtotal : 0;
          const menuDiscount = discount * discountRatio;
          const menuAfterDiscount = menuItemsTotal - menuDiscount;
          const taxAmount = menuAfterDiscount * (Number(menu.tax_rate) / 100);
          breakdown.push({
            name: `${menu.name} Tax`,
            rate: Number(menu.tax_rate),
            amount: taxAmount
          });
        }
      }
    });
    
    // 2. Restaurant-level taxes (if not included in price)
    if (taxes && taxes.length > 0 && !settings?.tax_included_in_price) {
      taxes.forEach(tax => {
        breakdown.push({
          name: tax.name,
          rate: Number(tax.rate),
          amount: afterDiscount * (Number(tax.rate) / 100)
        });
      });
    }
    
    return breakdown;
  }, [menus, cart, taxes, subtotal, discount, afterDiscount, settings?.tax_included_in_price]);

  const totalTax = taxBreakdown.reduce((sum, t) => sum + t.amount, 0);

  // Delivery fee with zone validation
  const validatedZone = useMemo(() => {
    if (orderType !== 'delivery' || !deliveryPinCode) return null;
    const zones = settings?.delivery_zones || [];
    return zones.find(z => z.pin_codes?.includes(deliveryPinCode)) || null;
  }, [orderType, deliveryPinCode, settings?.delivery_zones]);

  const deliveryFee = orderType === 'delivery' 
    ? (validatedZone?.fee ?? selectedZone?.fee ?? settings?.delivery_charge ?? 0) 
    : 0;

  const isDeliveryValid = orderType !== 'delivery' || 
    !settings?.delivery_zones?.some(z => z.pin_codes && z.pin_codes.length > 0) || 
    validatedZone !== null;

  const total = afterDiscount + totalTax + deliveryFee;

  const handleDownloadReceipt = () => {
    if (!orderDetails) return;
    
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;
    
    const itemsHtml = cart.length > 0 ? cart.map(item => `
      <tr>
        <td style="padding: 8px 0;">${item.quantity}x ${item.menuItem.name}</td>
        <td style="padding: 8px 0; text-align: right;">$${calculateItemPrice(item).toFixed(2)}</td>
      </tr>
    `).join('') : '';
    
    const taxHtml = taxBreakdown.map(tax => `
      <tr>
        <td style="padding: 4px 0; color: #666;">${tax.name} (${tax.rate}%)</td>
        <td style="padding: 4px 0; text-align: right; color: #666;">$${tax.amount.toFixed(2)}</td>
      </tr>
    `).join('');
    
    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Receipt - ${restaurant?.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 400px; margin: 0 auto; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; }
          .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #333; }
          .discount { color: #22c55e; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${restaurant?.name}</h1>
        <p class="meta">
          ${new Date().toLocaleString()}<br>
          ${orderType === 'delivery' ? 'Delivery' : orderType === 'dine-in' ? 'Dine-in' : 'Pickup'}
        </p>
        
        <table><tbody>${itemsHtml}</tbody></table>
        
        <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee;">
        
        <table>
          <tr><td>Subtotal</td><td style="text-align: right;">$${subtotal.toFixed(2)}</td></tr>
          ${discount > 0 ? `<tr class="discount"><td>Discount</td><td style="text-align: right;">-$${discount.toFixed(2)}</td></tr>` : ''}
          ${taxHtml}
          ${deliveryFee > 0 ? `<tr><td>Delivery Fee</td><td style="text-align: right;">$${deliveryFee.toFixed(2)}</td></tr>` : ''}
          <tr class="total-row"><td style="padding-top: 12px;">Total</td><td style="padding-top: 12px; text-align: right;">$${total.toFixed(2)}</td></tr>
        </table>
        
        <p style="text-align: center; margin-top: 32px; color: #666; font-size: 14px;">Thank you for your order!</p>
        <button onclick="window.print()" style="width: 100%; padding: 12px; margin-top: 20px; background: #333; color: white; border: none; border-radius: 8px; cursor: pointer;">Print Receipt</button>
      </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  const handlePlaceOrder = async () => {
    if (!restaurant || cart.length === 0) return;
    if (!isDeliveryValid) {
      toast({ title: 'Invalid delivery', description: 'Delivery not available for this pin code', variant: 'destructive' });
      return;
    }

    setIsPlacingOrder(true);
    
    try {
      const orderItems = cart.map((item) => ({
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        variation_id: item.selectedVariation?.id,
        addon_ids: item.selectedAddons?.map(a => ({ id: a.addon.id, quantity: a.quantity })),
      }));

      const { data, error } = await supabase.functions.invoke('public-order', {
        body: {
          restaurant_id: restaurant.id,
          items: orderItems,
          coupon_code: appliedDiscount?.coupon_code,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          order_type: orderType,
          delivery_address: orderType === 'delivery' ? `${deliveryAddress} - ${deliveryPinCode}` : undefined,
          delivery_fee: deliveryFee,
        },
      });

      if (error) throw error;

      setOrderDetails(data);
      setOrderPlaced(true);
      setCart([]);
      setAppliedDiscount(null);
      setCouponCode('');
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setDeliveryPinCode('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to place order';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loadingRestaurant || loadingMenus) {
    return (
      <PublicLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (!restaurant) {
    return (
      <PublicLayout>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Restaurant Not Found</h1>
          <p className="text-muted-foreground mb-4">This restaurant doesn't exist or is no longer available.</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  if (orderPlaced) {
    return (
      <PublicLayout>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 text-accent mb-6">
            <Check className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Placed!</h1>
          <p className="text-lg text-muted-foreground mb-2">Thank you for your order at {restaurant.name}</p>
          <p className="text-muted-foreground mb-8">
            {orderType === 'delivery' 
              ? 'Your order will be delivered to you soon.' 
              : orderType === 'dine-in'
              ? 'Your order will be served at your table.'
              : 'Please pay at the restaurant when you arrive.'}
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Button onClick={handleDownloadReceipt} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download Receipt
            </Button>
            <Button onClick={() => setOrderPlaced(false)}>Order Again</Button>
            <Link to={`/r/${slug}/book-table`}>
              <Button variant="outline" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Book a Table
              </Button>
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <ChefHat className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">{restaurant.name}</span>
            </div>
            <Link to={`/r/${slug}/book-table`}>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Book Table
              </Button>
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Menu */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Menu</h2>
              
              {menus?.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No menu available yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  {menus?.map((menu) => (
                    <div key={menu.id}>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {menu.name}
                        <Badge variant="secondary">{menu.menu_items?.length || 0} items</Badge>
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {menu.menu_items?.filter((item) => item.is_available).map((item) => {
                          const quantity = getCartQuantity(item.id);
                          const hasOptions = (item.variations && item.variations.length > 0) || 
                                           (item.addons && item.addons.length > 0);
                          return (
                            <Card key={item.id} className="overflow-hidden">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{item.name}</h4>
                                    <p className="text-lg font-bold text-primary mt-1">
                                      ${Number(item.price).toFixed(2)}
                                      {hasOptions && <span className="text-xs font-normal text-muted-foreground ml-1">+</span>}
                                    </p>
                                    {hasOptions && (
                                      <p className="text-xs text-muted-foreground">
                                        {item.variations && item.variations.length > 0 && `${item.variations.length} options`}
                                        {item.addons && item.addons.length > 0 && ` • ${item.addons.length} extras`}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {quantity > 0 && (
                                      <Badge variant="secondary">{quantity} in cart</Badge>
                                    )}
                                    <Button onClick={() => handleItemClick(item)} className="gap-2">
                                      <Plus className="h-4 w-4" />
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Your Order
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Your cart is empty
                    </p>
                  ) : (
                    <>
                      <ScrollArea className="max-h-48">
                        <div className="space-y-3">
                          {cart.map((item, index) => (
                            <div key={index} className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.quantity}x</span>
                                  <span className="text-sm">{item.menuItem.name}</span>
                                </div>
                                {item.selectedVariation && (
                                  <span className="text-xs text-muted-foreground ml-6">
                                    {item.selectedVariation.name}
                                  </span>
                                )}
                                {item.selectedAddons && item.selectedAddons.length > 0 && (
                                  <span className="text-xs text-accent ml-6 block">
                                    + {item.selectedAddons.map(a => a.addon.name).join(', ')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  ${calculateItemPrice(item).toFixed(2)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-6 w-6"
                                    onClick={() => removeFromCart(index)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-6 w-6"
                                    onClick={() => incrementCartItem(index)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="border-t border-border mt-4 pt-4 space-y-4">
                        {/* Order Type */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Order Type</Label>
                          <RadioGroup 
                            value={orderType} 
                            onValueChange={(v) => setOrderType(v as 'dine-in' | 'pickup' | 'delivery')}
                            className="flex gap-4 flex-wrap"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="dine-in" id="dine-in" />
                              <Label htmlFor="dine-in" className="flex items-center gap-1 cursor-pointer">
                                <UtensilsCrossed className="h-4 w-4" /> Dine-in
                              </Label>
                            </div>
                            {settings?.pickup_enabled !== false && (
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="pickup" id="pickup" />
                                <Label htmlFor="pickup" className="flex items-center gap-1 cursor-pointer">
                                  <Store className="h-4 w-4" /> Pickup
                                </Label>
                              </div>
                            )}
                            {settings?.delivery_enabled && (
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="delivery" id="delivery" />
                                <Label htmlFor="delivery" className="flex items-center gap-1 cursor-pointer">
                                  <Truck className="h-4 w-4" /> Delivery
                                </Label>
                              </div>
                            )}
                          </RadioGroup>
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-2">
                          <Input
                            placeholder="Your name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                          />
                          <Input
                            type="tel"
                            placeholder="Phone number (for updates)"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                          />
                          {orderType === 'delivery' && (
                            <>
                              <Input
                                placeholder="Delivery address"
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                              />
                              <Input
                                placeholder="Pin code"
                                value={deliveryPinCode}
                                onChange={(e) => setDeliveryPinCode(e.target.value)}
                              />
                              {deliveryPinCode && !isDeliveryValid && (
                                <p className="text-sm text-destructive">Delivery not available for this pin code</p>
                              )}
                              {validatedZone && (
                                <p className="text-sm text-accent">Delivery to {validatedZone.name} - Fee: ${validatedZone.fee.toFixed(2)}</p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Coupon */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          />
                          <Button variant="outline" onClick={applyCoupon}>
                            <Tag className="h-4 w-4" />
                          </Button>
                        </div>

                        {appliedDiscount && (
                          <p className="text-sm text-accent flex items-center gap-1">
                            <Check className="h-4 w-4" />
                            Coupon applied: {appliedDiscount.coupon_code}
                          </p>
                        )}

                        {/* Bill Summary */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between text-accent">
                              <span>Discount</span>
                              <span>-${discount.toFixed(2)}</span>
                            </div>
                          )}
                          {taxBreakdown.map((tax, i) => (
                            <div key={i} className="flex justify-between text-muted-foreground">
                              <span>{tax.name} ({tax.rate}%)</span>
                              <span>${tax.amount.toFixed(2)}</span>
                            </div>
                          ))}
                          {deliveryFee > 0 && (
                            <div className="flex justify-between">
                              <span>Delivery Fee</span>
                              <span>${deliveryFee.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                          </div>
                        </div>

                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handlePlaceOrder}
                          disabled={isPlacingOrder}
                        >
                          {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Place Order
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                          {orderType === 'delivery' 
                            ? 'Pay on delivery' 
                            : 'Pay at the restaurant when you arrive'}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Item Options Modal */}
        {optionsModal.item && (
          <ItemOptionsModal
            open={optionsModal.open}
            onOpenChange={(open) => setOptionsModal({ ...optionsModal, open })}
            menuItem={optionsModal.item}
            onAddToCart={addToCart}
          />
        )}
      </div>
    </PublicLayout>
  );
}
