import { useState } from 'react';
import { DashboardLayout } from '@/components/Layout';
import { useRestaurants, useDiscounts, useCreateDiscount, useUpdateDiscount, useDeleteDiscount, useMenus } from '@/hooks/useRestaurant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Loader2, Percent, Tag, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Discount, DiscountType, DiscountValueType } from '@/types/database';

export default function DiscountsManagement() {
  const { data: restaurants } = useRestaurants();
  const restaurant = restaurants?.[0];
  const { data: discounts, isLoading } = useDiscounts(restaurant?.id || '');
  const { data: menus } = useMenus(restaurant?.id || '');
  const createDiscount = useCreateDiscount();
  const updateDiscount = useUpdateDiscount();
  const deleteDiscount = useDeleteDiscount();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [type, setType] = useState<DiscountType>('menu');
  const [valueType, setValueType] = useState<DiscountValueType>('percentage');
  const [value, setValue] = useState('');
  const [menuId, setMenuId] = useState('');
  const [couponCode, setCouponCode] = useState('');

  const resetForm = () => {
    setType('menu');
    setValueType('percentage');
    setValue('');
    setMenuId('');
    setCouponCode('');
  };

  const handleCreate = async () => {
    if (!restaurant || !value) return;

    const data: any = {
      restaurant_id: restaurant.id,
      type,
      value_type: valueType,
      value: parseFloat(value),
    };

    if (type === 'menu' && menuId) {
      data.menu_id = menuId;
    }
    if (type === 'coupon' && couponCode) {
      data.coupon_code = couponCode.toUpperCase().trim();
    }

    try {
      await createDiscount.mutateAsync(data);
      toast({ title: 'Discount created' });
      setShowCreate(false);
      resetForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (discount: Discount) => {
    if (!restaurant) return;
    try {
      await updateDiscount.mutateAsync({
        id: discount.id,
        restaurant_id: restaurant.id,
        is_active: !discount.is_active,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (discount: Discount) => {
    if (!restaurant) return;
    try {
      await deleteDiscount.mutateAsync({ id: discount.id, restaurant_id: restaurant.id });
      toast({ title: 'Discount deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getDiscountLabel = (discount: Discount) => {
    const amount = discount.value_type === 'percentage' 
      ? `${discount.value}%` 
      : `$${Number(discount.value).toFixed(2)}`;
    
    switch (discount.type) {
      case 'coupon':
        return `${amount} off with code "${discount.coupon_code}"`;
      case 'menu':
        return `${amount} off entire menu`;
      case 'item':
        return `${amount} off specific item`;
      default:
        return amount;
    }
  };

  const getTypeIcon = (type: DiscountType) => {
    switch (type) {
      case 'coupon': return <Ticket className="h-4 w-4" />;
      case 'menu': return <Tag className="h-4 w-4" />;
      default: return <Percent className="h-4 w-4" />;
    }
  };

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
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Percent className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Discounts & Coupons</h1>
            </div>
            <p className="text-muted-foreground">Create and manage discounts for your customers</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Discount
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : discounts?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Percent className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No discounts yet</h3>
              <p className="text-muted-foreground mb-4">Create discounts to attract more customers</p>
              <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Discount
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts?.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(discount.type)}
                        <span className="capitalize">{discount.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{getDiscountLabel(discount)}</TableCell>
                    <TableCell>
                      <Badge variant={discount.is_active ? 'default' : 'secondary'}>
                        {discount.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Switch
                          checked={discount.is_active}
                          onCheckedChange={() => handleToggleActive(discount)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(discount)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Discount</DialogTitle>
              <DialogDescription>Set up a discount for your customers</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as DiscountType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="menu">Entire Menu</SelectItem>
                    <SelectItem value="item">Specific Item</SelectItem>
                    <SelectItem value="coupon">Coupon Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === 'menu' && menus && menus.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Menu (optional)</Label>
                  <Select value={menuId} onValueChange={setMenuId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All menus" />
                    </SelectTrigger>
                    <SelectContent>
                      {menus.map((menu) => (
                        <SelectItem key={menu.id} value={menu.id}>{menu.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {type === 'coupon' && (
                <div className="space-y-2">
                  <Label>Coupon Code</Label>
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="SAVE20"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Value Type</Label>
                  <Select value={valueType} onValueChange={(v) => setValueType(v as DiscountValueType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={valueType === 'percentage' ? '10' : '5.00'}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createDiscount.isPending}>
                {createDiscount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Discount
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
