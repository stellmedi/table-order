import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/Layout';
import { useRestaurantBySlug, usePublicMenus, usePublicDiscounts, useCreateOrder } from '@/hooks/useRestaurant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChefHat, 
  Plus, 
  Minus, 
  ShoppingCart, 
  CalendarDays,
  Loader2,
  Check,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CartItem, MenuItem, Discount } from '@/types/database';

export default function CustomerOrder() {
  const { slug } = useParams<{ slug: string }>();
  const { data: restaurant, isLoading: loadingRestaurant } = useRestaurantBySlug(slug || '');
  const { data: menus, isLoading: loadingMenus } = usePublicMenus(restaurant?.id || '');
  const { data: discounts } = usePublicDiscounts(restaurant?.id || '');
  const createOrder = useCreateOrder();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const addToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.menuItem.id === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.menuItem.id !== menuItemId);
    });
  };

  const getCartQuantity = (menuItemId: string) => {
    return cart.find((item) => item.menuItem.id === menuItemId)?.quantity || 0;
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
    0
  );

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
      // Check for active menu discount
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
  const total = Math.max(0, subtotal - discount);

  const handlePlaceOrder = async () => {
    if (!restaurant || cart.length === 0) return;

    try {
      await createOrder.mutateAsync({
        restaurant_id: restaurant.id,
        total,
        coupon_code: appliedDiscount?.coupon_code || undefined,
        discount_applied: discount,
        items: cart.map((item) => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          price: Number(item.menuItem.price),
        })),
      });
      setOrderPlaced(true);
      setCart([]);
      setAppliedDiscount(null);
      setCouponCode('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
          <p className="text-muted-foreground mb-8">Please pay at the restaurant when you arrive.</p>
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
                          return (
                            <Card key={item.id} className="overflow-hidden">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{item.name}</h4>
                                    <p className="text-lg font-bold text-primary mt-1">
                                      ${Number(item.price).toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {quantity > 0 ? (
                                      <>
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          onClick={() => removeFromCart(item.id)}
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-8 text-center font-semibold">{quantity}</span>
                                        <Button
                                          size="icon"
                                          onClick={() => addToCart(item)}
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <Button onClick={() => addToCart(item)} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Add
                                      </Button>
                                    )}
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
                      <ScrollArea className="max-h-64">
                        <div className="space-y-3">
                          {cart.map((item) => (
                            <div key={item.menuItem.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.quantity}x</span>
                                <span className="text-sm">{item.menuItem.name}</span>
                              </div>
                              <span className="font-medium">
                                ${(Number(item.menuItem.price) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="border-t border-border mt-4 pt-4 space-y-3">
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
                          <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                          </div>
                        </div>

                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handlePlaceOrder}
                          disabled={createOrder.isPending}
                        >
                          {createOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Place Order
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                          Pay at the restaurant when you arrive
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
