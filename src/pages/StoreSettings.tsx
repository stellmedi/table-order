import { useState } from 'react';
import { DashboardLayout } from '@/components/Layout';
import { useRestaurants } from '@/hooks/useRestaurant';
import { useRestaurantSettings, useUpdateRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Clock, Truck, Calculator } from 'lucide-react';
import { DeliveryZoneMap } from '@/components/DeliveryZoneMap';
import type { OpeningHours, DayHours, DeliveryZone } from '@/types/database';

const DAYS: (keyof OpeningHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DEFAULT_HOURS: OpeningHours = {
  monday: { open: '09:00', close: '22:00', is_open: true },
  tuesday: { open: '09:00', close: '22:00', is_open: true },
  wednesday: { open: '09:00', close: '22:00', is_open: true },
  thursday: { open: '09:00', close: '22:00', is_open: true },
  friday: { open: '09:00', close: '22:00', is_open: true },
  saturday: { open: '10:00', close: '23:00', is_open: true },
  sunday: { open: '10:00', close: '21:00', is_open: true },
};

export default function StoreSettings() {
  const { data: restaurants, isLoading: loadingRestaurants } = useRestaurants();
  const restaurant = restaurants?.[0];
  const { data: settings, isLoading: loadingSettings } = useRestaurantSettings(restaurant?.id || '');
  const updateSettings = useUpdateRestaurantSettings();
  const { toast } = useToast();

  const [openingHours, setOpeningHours] = useState<OpeningHours>(settings?.opening_hours || DEFAULT_HOURS);
  const [pickupEnabled, setPickupEnabled] = useState(settings?.pickup_enabled ?? true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(settings?.delivery_enabled ?? false);
  const [minOrderValue, setMinOrderValue] = useState(settings?.minimum_order_value ?? 0);
  const [deliveryCharge, setDeliveryCharge] = useState(settings?.delivery_charge ?? 0);
  const [prepTime, setPrepTime] = useState(settings?.preparation_time_minutes ?? 20);
  const [taxIncluded, setTaxIncluded] = useState(settings?.tax_included_in_price ?? true);
  const [taxRate, setTaxRate] = useState(settings?.tax_rate ?? 0);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(settings?.delivery_zones || []);

  // Update state when settings load
  useState(() => {
    if (settings) {
      setOpeningHours(settings.opening_hours);
      setPickupEnabled(settings.pickup_enabled);
      setDeliveryEnabled(settings.delivery_enabled);
      setMinOrderValue(settings.minimum_order_value);
      setDeliveryCharge(settings.delivery_charge);
      setPrepTime(settings.preparation_time_minutes);
      setTaxIncluded(settings.tax_included_in_price);
      setTaxRate(settings.tax_rate);
      setDeliveryZones(settings.delivery_zones);
    }
  });

  const handleDayChange = (day: keyof OpeningHours, field: keyof DayHours, value: string | boolean) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSave = async () => {
    if (!restaurant) return;
    
    try {
      await updateSettings.mutateAsync({
        restaurant_id: restaurant.id,
        opening_hours: openingHours,
        pickup_enabled: pickupEnabled,
        delivery_enabled: deliveryEnabled,
        minimum_order_value: minOrderValue,
        delivery_charge: deliveryCharge,
        preparation_time_minutes: prepTime,
        tax_included_in_price: taxIncluded,
        tax_rate: taxRate,
        delivery_zones: deliveryZones,
      });
      toast({ title: 'Settings saved', description: 'Your store settings have been updated.' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  if (loadingRestaurants || loadingSettings) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

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
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Store Settings</h1>
          <p className="text-muted-foreground">Configure your restaurant's operating hours and delivery options.</p>
        </div>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Operating Hours
            </CardTitle>
            <CardDescription>Set your open and close times for each day</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-4 flex-wrap">
                <div className="w-28 capitalize font-medium">{day}</div>
                <Switch
                  checked={openingHours[day].is_open}
                  onCheckedChange={(checked) => handleDayChange(day, 'is_open', checked)}
                />
                <span className="text-sm text-muted-foreground w-12">
                  {openingHours[day].is_open ? 'Open' : 'Closed'}
                </span>
                {openingHours[day].is_open && (
                  <>
                    <Input
                      type="time"
                      value={openingHours[day].open}
                      onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                      className="w-32"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={openingHours[day].close}
                      onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                      className="w-32"
                    />
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Delivery & Pickup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery & Pickup
            </CardTitle>
            <CardDescription>Configure order fulfillment options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Pickup Enabled</Label>
                <p className="text-sm text-muted-foreground">Allow customers to pick up orders</p>
              </div>
              <Switch checked={pickupEnabled} onCheckedChange={setPickupEnabled} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Delivery Enabled</Label>
                <p className="text-sm text-muted-foreground">Offer delivery to customers</p>
              </div>
              <Switch checked={deliveryEnabled} onCheckedChange={setDeliveryEnabled} />
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="minOrder">Minimum Order Value ($)</Label>
                <Input
                  id="minOrder"
                  type="number"
                  min="0"
                  step="0.01"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="deliveryCharge">Default Delivery Charge ($)</Label>
                <Input
                  id="deliveryCharge"
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="prepTime">Preparation Time (minutes)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  min="5"
                  value={prepTime}
                  onChange={(e) => setPrepTime(parseInt(e.target.value) || 20)}
                />
              </div>
            </div>

            <Separator />

            <div>
              <div className="mb-4">
                <Label>Delivery Zones</Label>
                <p className="text-sm text-muted-foreground">Draw delivery zones on the map to set different fees for areas</p>
              </div>
              
              <DeliveryZoneMap 
                zones={deliveryZones} 
                onZonesChange={setDeliveryZones} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Tax Settings
            </CardTitle>
            <CardDescription>Configure how taxes are applied to orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Tax Included in Prices</Label>
                <p className="text-sm text-muted-foreground">
                  {taxIncluded 
                    ? 'Prices shown include tax' 
                    : 'Tax will be added at checkout'}
                </p>
              </div>
              <Switch checked={taxIncluded} onCheckedChange={setTaxIncluded} />
            </div>

            <div className="max-w-xs">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateSettings.isPending} size="lg">
            {updateSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
