import { useState } from 'react';
import { DashboardLayout } from '@/components/Layout';
import { useRestaurants, useTables, useCreateTable, useUpdateTable, useDeleteTable } from '@/hooks/useRestaurant';
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
import { Plus, Pencil, Trash2, Loader2, Grid3X3, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { RestaurantTable } from '@/types/database';

export default function TablesManagement() {
  const { data: restaurants } = useRestaurants();
  const restaurant = restaurants?.[0];
  const { data: tables, isLoading } = useTables(restaurant?.id || '');
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [editTable, setEditTable] = useState<RestaurantTable | null>(null);
  const [nameOrNumber, setNameOrNumber] = useState('');
  const [capacity, setCapacity] = useState('');

  const resetForm = () => {
    setNameOrNumber('');
    setCapacity('');
  };

  const handleCreate = async () => {
    if (!restaurant || !nameOrNumber.trim() || !capacity) return;

    try {
      await createTable.mutateAsync({
        restaurant_id: restaurant.id,
        name_or_number: nameOrNumber.trim(),
        capacity: parseInt(capacity),
      });
      toast({ title: 'Table created' });
      setShowCreate(false);
      resetForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!restaurant || !editTable || !nameOrNumber.trim() || !capacity) return;

    try {
      await updateTable.mutateAsync({
        id: editTable.id,
        restaurant_id: restaurant.id,
        name_or_number: nameOrNumber.trim(),
        capacity: parseInt(capacity),
      });
      toast({ title: 'Table updated' });
      setEditTable(null);
      resetForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (table: RestaurantTable) => {
    if (!restaurant) return;
    try {
      await updateTable.mutateAsync({
        id: table.id,
        restaurant_id: restaurant.id,
        is_active: !table.is_active,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (table: RestaurantTable) => {
    if (!restaurant) return;
    try {
      await deleteTable.mutateAsync({ id: table.id, restaurant_id: restaurant.id });
      toast({ title: 'Table deleted' });
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
              <Grid3X3 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Table Management</h1>
            </div>
            <p className="text-muted-foreground">Set up tables for dine-in bookings</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Table
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tables?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Grid3X3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tables yet</h3>
              <p className="text-muted-foreground mb-4">Add tables for customers to book</p>
              <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Table
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tables?.map((table) => (
              <Card key={table.id} className={`transition-all ${!table.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
                      {table.name_or_number}
                    </div>
                    <Badge variant={table.is_active ? 'default' : 'secondary'}>
                      {table.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {table.capacity} guests</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Switch
                      checked={table.is_active}
                      onCheckedChange={() => handleToggleActive(table)}
                    />
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditTable(table);
                          setNameOrNumber(table.name_or_number);
                          setCapacity(String(table.capacity));
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(table)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
              <DialogDescription>Create a table for dine-in bookings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Table Name or Number</Label>
                <Input
                  value={nameOrNumber}
                  onChange={(e) => setNameOrNumber(e.target.value)}
                  placeholder="e.g., 1, A1, Patio 3"
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity (guests)</Label>
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="4"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createTable.isPending}>
                {createTable.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Table
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editTable} onOpenChange={() => { setEditTable(null); resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Table</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Table Name or Number</Label>
                <Input
                  value={nameOrNumber}
                  onChange={(e) => setNameOrNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity (guests)</Label>
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditTable(null); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateTable.isPending}>
                {updateTable.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
