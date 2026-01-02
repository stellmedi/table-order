import { useState, useMemo } from 'react';
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
  Store
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
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);

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

  // Calculate taxes
  const taxBreakdown = useMemo(() => {
    if (!taxes || taxes.length === 0 || settings?.tax_included_in_price) {
      return [];
    }
    return taxes.map(tax => ({
      name: tax.name,
      rate: Number(tax.rate),
      amount: afterDiscount * (Number(tax.rate) / 100),
    }));
  }, [taxes, afterDiscount, settings?.tax_included_in_price]);

  const totalTax = taxBreakdown.reduce((sum, t) => sum + t.amount, 0);

  // Delivery fee
  const deliveryFee = orderType === 'delivery' ? (selectedZone?.fee || settings?.delivery_charge || 0) : 0;

  const total = afterDiscount + totalTax + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!restaurant || cart.length === 0) return;

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
          delivery_address: orderType === 'delivery' ? deliveryAddress : undefined,
          delivery_fee: deliveryFee,
        },
      });

      if (error) throw error;

      setOrderPlaced(true);
      setCart([]);
      setAppliedDiscount(null);
      setCouponCode('');
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
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
              : 'Please pay at the restaurant when you arrive.'}
          </p>
          <div className="flex gap-4">
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
                        {settings?.delivery_enabled && (
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Order Type</Label>
                            <RadioGroup 
                              value={orderType} 
                              onValueChange={(v) => setOrderType(v as 'pickup' | 'delivery')}
                              className="flex gap-4"
                            >
                              {settings?.pickup_enabled && (
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem value="pickup" id="pickup" />
                                  <Label htmlFor="pickup" className="flex items-center gap-1 cursor-pointer">
                                    <Store className="h-4 w-4" /> Pickup
                                  </Label>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="delivery" id="delivery" />
                                <Label htmlFor="delivery" className="flex items-center gap-1 cursor-pointer">
                                  <Truck className="h-4 w-4" /> Delivery
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        )}

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
                            <Input
                              placeholder="Delivery address"
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
                            />
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
