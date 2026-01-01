import { useState } from 'react';
import { DashboardLayout } from '@/components/Layout';
import { useRestaurants, useMenus, useCreateMenu, useUpdateMenu, useDeleteMenu, useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from '@/hooks/useRestaurant';
import { useVariations, useAddons } from '@/hooks/useMenuItemOptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Pencil, Trash2, Loader2, Menu as MenuIcon, UtensilsCrossed, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItemOptionsEditor } from '@/components/MenuItemOptionsEditor';
import type { Menu, MenuItem } from '@/types/database';

function MenuItemOptionsBadges({ menuItemId }: { menuItemId: string }) {
  const { data: variations } = useVariations(menuItemId);
  const { data: addons } = useAddons(menuItemId);
  
  const variationCount = variations?.length || 0;
  const addonCount = addons?.length || 0;
  
  if (variationCount === 0 && addonCount === 0) return null;
  
  return (
    <div className="flex gap-1 mt-1">
      {variationCount > 0 && (
        <Badge variant="outline" className="text-xs">
          {variationCount} variation{variationCount !== 1 ? 's' : ''}
        </Badge>
      )}
      {addonCount > 0 && (
        <Badge variant="outline" className="text-xs">
          {addonCount} add-on{addonCount !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}

function MenuItemList({ menuId, restaurantId }: { menuId: string; restaurantId: string }) {
  const { data: items, isLoading } = useMenuItems(menuId);
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [optionsItem, setOptionsItem] = useState<MenuItem | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const handleAdd = async () => {
    if (!name.trim() || !price) return;
    try {
      await createItem.mutateAsync({
        menu_id: menuId,
        name: name.trim(),
        price: parseFloat(price),
      });
      toast({ title: 'Item added' });
      setShowAdd(false);
      setName('');
      setPrice('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !name.trim() || !price) return;
    try {
      await updateItem.mutateAsync({
        id: editItem.id,
        menu_id: menuId,
        name: name.trim(),
        price: parseFloat(price),
      });
      toast({ title: 'Item updated' });
      setEditItem(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        menu_id: menuId,
        is_available: !item.is_available,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (item: MenuItem) => {
    try {
      await deleteItem.mutateAsync({ id: item.id, menu_id: menuId });
      toast({ title: 'Item deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="py-4 text-center text-muted-foreground">Loading items...</div>;
  }

  return (
    <div className="space-y-3">
      {items?.length === 0 ? (
        <p className="py-4 text-center text-muted-foreground">No items yet. Add your first menu item.</p>
      ) : (
        items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.name}</p>
                  {!item.is_available && (
                    <Badge variant="secondary" className="text-xs">Out of Stock</Badge>
                  )}
                </div>
                <p className="text-sm text-primary font-semibold">${Number(item.price).toFixed(2)}</p>
                <MenuItemOptionsBadges menuItemId={item.id} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-2">
                <span className="text-sm text-muted-foreground">Available</span>
                <Switch
                  checked={item.is_available}
                  onCheckedChange={() => handleToggleAvailable(item)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOptionsItem(item)}
                title="Manage variations & add-ons"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditItem(item);
                  setName(item.name);
                  setPrice(String(item.price));
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(item)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))
      )}

      <Button variant="outline" className="w-full gap-2" onClick={() => setShowAdd(true)}>
        <Plus className="h-4 w-4" />
        Add Item
      </Button>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Margherita Pizza" />
            </div>
            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="12.99" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createItem.isPending}>
              {createItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateItem.isPending}>
              {updateItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {optionsItem && (
        <MenuItemOptionsEditor
          item={optionsItem}
          open={!!optionsItem}
          onOpenChange={(open) => !open && setOptionsItem(null)}
        />
      )}
    </div>
  );
}

export default function MenuManagement() {
  const { data: restaurants } = useRestaurants();
  const restaurant = restaurants?.[0];
  const { data: menus, isLoading } = useMenus(restaurant?.id || '');
  const createMenu = useCreateMenu();
  const updateMenu = useUpdateMenu();
  const deleteMenu = useDeleteMenu();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [editMenu, setEditMenu] = useState<Menu | null>(null);
  const [menuName, setMenuName] = useState('');

  const handleCreate = async () => {
    if (!restaurant || !menuName.trim()) return;
    try {
      await createMenu.mutateAsync({
        restaurant_id: restaurant.id,
        name: menuName.trim(),
      });
      toast({ title: 'Menu created' });
      setShowCreate(false);
      setMenuName('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!restaurant || !editMenu || !menuName.trim()) return;
    try {
      await updateMenu.mutateAsync({
        id: editMenu.id,
        restaurant_id: restaurant.id,
        name: menuName.trim(),
      });
      toast({ title: 'Menu updated' });
      setEditMenu(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (menu: Menu) => {
    if (!restaurant) return;
    try {
      await updateMenu.mutateAsync({
        id: menu.id,
        restaurant_id: restaurant.id,
        is_active: !menu.is_active,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (menu: Menu) => {
    if (!restaurant) return;
    try {
      await deleteMenu.mutateAsync({ id: menu.id, restaurant_id: restaurant.id });
      toast({ title: 'Menu deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
              <MenuIcon className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Menu Management</h1>
            </div>
            <p className="text-muted-foreground">Create menus and add items with variations and add-ons</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Menu
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : menus?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No menus yet</h3>
              <p className="text-muted-foreground mb-4">Create your first menu to start adding items</p>
              <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Menu
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {menus?.map((menu) => (
              <AccordionItem key={menu.id} value={menu.id} className="border rounded-xl px-6">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold">{menu.name}</span>
                    <Badge variant={menu.is_active ? 'default' : 'secondary'}>
                      {menu.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
                    <div className="flex items-center gap-2 mr-auto">
                      <span className="text-sm text-muted-foreground">Active</span>
                      <Switch
                        checked={menu.is_active}
                        onCheckedChange={() => handleToggleActive(menu)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditMenu(menu);
                        setMenuName(menu.name);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(menu)}
                    >
                      <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                      Delete
                    </Button>
                  </div>
                  <MenuItemList menuId={menu.id} restaurantId={restaurant.id} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Menu</DialogTitle>
              <DialogDescription>Add a new menu category for your restaurant</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Menu Name</Label>
              <Input
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="e.g., Lunch Menu, Dinner Specials"
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMenu.isPending}>
                {createMenu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Menu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editMenu} onOpenChange={() => setEditMenu(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Menu</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label>Menu Name</Label>
              <Input
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditMenu(null)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={updateMenu.isPending}>
                {updateMenu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
