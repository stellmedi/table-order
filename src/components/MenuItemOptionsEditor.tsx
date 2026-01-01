import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Loader2, Settings2, Layers, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useVariations,
  useCreateVariation,
  useUpdateVariation,
  useDeleteVariation,
  useAddons,
  useCreateAddon,
  useUpdateAddon,
  useDeleteAddon,
} from '@/hooks/useMenuItemOptions';
import type { MenuItem, MenuItemVariation, MenuItemAddon } from '@/types/database';

interface MenuItemOptionsEditorProps {
  item: MenuItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MenuItemOptionsEditor({ item, open, onOpenChange }: MenuItemOptionsEditorProps) {
  const { toast } = useToast();
  
  // Variations
  const { data: variations, isLoading: loadingVariations } = useVariations(item.id);
  const createVariation = useCreateVariation();
  const updateVariation = useUpdateVariation();
  const deleteVariation = useDeleteVariation();
  
  // Addons
  const { data: addons, isLoading: loadingAddons } = useAddons(item.id);
  const createAddon = useCreateAddon();
  const updateAddon = useUpdateAddon();
  const deleteAddon = useDeleteAddon();

  // Form state for variations
  const [showAddVariation, setShowAddVariation] = useState(false);
  const [editVariation, setEditVariation] = useState<MenuItemVariation | null>(null);
  const [variationName, setVariationName] = useState('');
  const [variationPrice, setVariationPrice] = useState('');

  // Form state for addons
  const [showAddAddon, setShowAddAddon] = useState(false);
  const [editAddon, setEditAddon] = useState<MenuItemAddon | null>(null);
  const [addonName, setAddonName] = useState('');
  const [addonPrice, setAddonPrice] = useState('');

  const resetVariationForm = () => {
    setVariationName('');
    setVariationPrice('');
    setShowAddVariation(false);
    setEditVariation(null);
  };

  const resetAddonForm = () => {
    setAddonName('');
    setAddonPrice('');
    setShowAddAddon(false);
    setEditAddon(null);
  };

  const handleAddVariation = async () => {
    if (!variationName.trim()) return;
    try {
      await createVariation.mutateAsync({
        menu_item_id: item.id,
        name: variationName.trim(),
        price_adjustment: parseFloat(variationPrice) || 0,
        sort_order: (variations?.length || 0) + 1,
      });
      toast({ title: 'Variation added' });
      resetVariationForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateVariation = async () => {
    if (!editVariation || !variationName.trim()) return;
    try {
      await updateVariation.mutateAsync({
        id: editVariation.id,
        menu_item_id: item.id,
        name: variationName.trim(),
        price_adjustment: parseFloat(variationPrice) || 0,
      });
      toast({ title: 'Variation updated' });
      resetVariationForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleVariation = async (variation: MenuItemVariation) => {
    try {
      await updateVariation.mutateAsync({
        id: variation.id,
        menu_item_id: item.id,
        is_available: !variation.is_available,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteVariation = async (variation: MenuItemVariation) => {
    try {
      await deleteVariation.mutateAsync({ id: variation.id, menu_item_id: item.id });
      toast({ title: 'Variation deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddAddon = async () => {
    if (!addonName.trim()) return;
    try {
      await createAddon.mutateAsync({
        menu_item_id: item.id,
        name: addonName.trim(),
        price: parseFloat(addonPrice) || 0,
        sort_order: (addons?.length || 0) + 1,
      });
      toast({ title: 'Add-on added' });
      resetAddonForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateAddon = async () => {
    if (!editAddon || !addonName.trim()) return;
    try {
      await updateAddon.mutateAsync({
        id: editAddon.id,
        menu_item_id: item.id,
        name: addonName.trim(),
        price: parseFloat(addonPrice) || 0,
      });
      toast({ title: 'Add-on updated' });
      resetAddonForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleAddon = async (addon: MenuItemAddon) => {
    try {
      await updateAddon.mutateAsync({
        id: addon.id,
        menu_item_id: item.id,
        is_available: !addon.is_available,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteAddon = async (addon: MenuItemAddon) => {
    try {
      await deleteAddon.mutateAsync({ id: addon.id, menu_item_id: item.id });
      toast({ title: 'Add-on deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Options for "{item.name}"
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="variations" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="variations" className="gap-2">
              <Layers className="h-4 w-4" />
              Variations ({variations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="addons" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add-ons ({addons?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="variations" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Add size options, spice levels, or other variations. Price adjustment is added to or subtracted from the base price.
            </p>

            {loadingVariations ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {variations?.map((variation) => (
                  <div
                    key={variation.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{variation.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {variation.price_adjustment >= 0 ? '+' : ''}${Number(variation.price_adjustment).toFixed(2)}
                        </p>
                      </div>
                      {!variation.is_available && (
                        <Badge variant="secondary">Unavailable</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={variation.is_available}
                        onCheckedChange={() => handleToggleVariation(variation)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditVariation(variation);
                          setVariationName(variation.name);
                          setVariationPrice(String(variation.price_adjustment));
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteVariation(variation)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}

                {showAddVariation || editVariation ? (
                  <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={variationName}
                          onChange={(e) => setVariationName(e.target.value)}
                          placeholder="e.g., Large, Extra Spicy"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price Adjustment ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variationPrice}
                          onChange={(e) => setVariationPrice(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={resetVariationForm}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={editVariation ? handleUpdateVariation : handleAddVariation}
                        disabled={createVariation.isPending || updateVariation.isPending}
                      >
                        {(createVariation.isPending || updateVariation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {editVariation ? 'Save' : 'Add'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowAddVariation(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Variation
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="addons" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Add extras customers can add to this item. Each add-on has its own price.
            </p>

            {loadingAddons ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {addons?.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{addon.name}</p>
                        <p className="text-sm text-muted-foreground">
                          +${Number(addon.price).toFixed(2)}
                        </p>
                      </div>
                      {!addon.is_available && (
                        <Badge variant="secondary">Unavailable</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={addon.is_available}
                        onCheckedChange={() => handleToggleAddon(addon)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditAddon(addon);
                          setAddonName(addon.name);
                          setAddonPrice(String(addon.price));
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAddon(addon)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}

                {showAddAddon || editAddon ? (
                  <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={addonName}
                          onChange={(e) => setAddonName(e.target.value)}
                          placeholder="e.g., Extra Cheese, Bacon"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={addonPrice}
                          onChange={(e) => setAddonPrice(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={resetAddonForm}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={editAddon ? handleUpdateAddon : handleAddAddon}
                        disabled={createAddon.isPending || updateAddon.isPending}
                      >
                        {(createAddon.isPending || updateAddon.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {editAddon ? 'Save' : 'Add'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowAddAddon(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Add-on
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
