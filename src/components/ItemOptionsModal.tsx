import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus } from 'lucide-react';
import type { MenuItem, MenuItemVariation, MenuItemAddon } from '@/types/database';

interface ItemOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: MenuItem;
  onAddToCart: (
    menuItem: MenuItem,
    selectedVariation?: MenuItemVariation,
    selectedAddons?: { addon: MenuItemAddon; quantity: number }[]
  ) => void;
}

export function ItemOptionsModal({
  open,
  onOpenChange,
  menuItem,
  onAddToCart,
}: ItemOptionsModalProps) {
  const [selectedVariation, setSelectedVariation] = useState<MenuItemVariation | undefined>(
    menuItem.variations?.[0]
  );
  const [selectedAddons, setSelectedAddons] = useState<Map<string, number>>(new Map());

  const handleAddonToggle = (addon: MenuItemAddon, checked: boolean) => {
    setSelectedAddons((prev) => {
      const newMap = new Map(prev);
      if (checked) {
        newMap.set(addon.id, 1);
      } else {
        newMap.delete(addon.id);
      }
      return newMap;
    });
  };

  const handleAddonQuantity = (addon: MenuItemAddon, delta: number) => {
    setSelectedAddons((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(addon.id) || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        newMap.delete(addon.id);
      } else {
        newMap.set(addon.id, newQty);
      }
      return newMap;
    });
  };

  const calculateTotal = () => {
    let total = Number(menuItem.price);
    
    if (selectedVariation) {
      total += Number(selectedVariation.price_adjustment);
    }
    
    selectedAddons.forEach((qty, addonId) => {
      const addon = menuItem.addons?.find((a) => a.id === addonId);
      if (addon) {
        total += Number(addon.price) * qty;
      }
    });
    
    return total;
  };

  const handleAddToCart = () => {
    const addonsArray: { addon: MenuItemAddon; quantity: number }[] = [];
    selectedAddons.forEach((qty, addonId) => {
      const addon = menuItem.addons?.find((a) => a.id === addonId);
      if (addon && qty > 0) {
        addonsArray.push({ addon, quantity: qty });
      }
    });

    onAddToCart(menuItem, selectedVariation, addonsArray.length > 0 ? addonsArray : undefined);
    onOpenChange(false);
    
    // Reset selections
    setSelectedVariation(menuItem.variations?.[0]);
    setSelectedAddons(new Map());
  };

  const hasVariations = menuItem.variations && menuItem.variations.length > 0;
  const hasAddons = menuItem.addons && menuItem.addons.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{menuItem.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Variations */}
          {hasVariations && (
            <div>
              <Label className="text-sm font-semibold mb-3 block">Choose an option</Label>
              <RadioGroup
                value={selectedVariation?.id || ''}
                onValueChange={(value) => {
                  const variation = menuItem.variations?.find((v) => v.id === value);
                  setSelectedVariation(variation);
                }}
              >
                {menuItem.variations
                  ?.filter((v) => v.is_available)
                  .map((variation) => (
                    <div
                      key={variation.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={variation.id} id={variation.id} />
                        <Label htmlFor={variation.id} className="cursor-pointer">
                          {variation.name}
                        </Label>
                      </div>
                      {Number(variation.price_adjustment) !== 0 && (
                        <span className="text-sm text-muted-foreground">
                          {Number(variation.price_adjustment) > 0 ? '+' : ''}
                          ${Number(variation.price_adjustment).toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
              </RadioGroup>
            </div>
          )}

          {/* Addons */}
          {hasAddons && (
            <div>
              <Label className="text-sm font-semibold mb-3 block">Add extras</Label>
              <div className="space-y-3">
                {menuItem.addons
                  ?.filter((a) => a.is_available)
                  .map((addon) => {
                    const quantity = selectedAddons.get(addon.id) || 0;
                    const isSelected = quantity > 0;

                    return (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={addon.id}
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleAddonToggle(addon, checked as boolean)
                            }
                          />
                          <Label htmlFor={addon.id} className="cursor-pointer">
                            {addon.name}
                          </Label>
                          <span className="text-sm text-primary">
                            +${Number(addon.price).toFixed(2)}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => handleAddonQuantity(addon, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">{quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => handleAddonQuantity(addon, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleAddToCart} className="w-full" size="lg">
            Add to Cart - ${calculateTotal().toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
