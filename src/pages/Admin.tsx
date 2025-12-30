import { useState } from 'react';
import { DashboardLayout } from '@/components/Layout';
import { useRestaurants, useUpdateRestaurant, useCreateRestaurant } from '@/hooks/useRestaurant';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Shield, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import type { PlanType } from '@/types/database';

export default function Admin() {
  const { role, loading: authLoading } = useAuth();
  const { data: restaurants, isLoading } = useRestaurants();
  const updateRestaurant = useUpdateRestaurant();
  const createRestaurant = useCreateRestaurant();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newPlan, setNewPlan] = useState<PlanType>('starter');

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateRestaurant.mutateAsync({ id, is_active: !currentStatus });
      toast({
        title: currentStatus ? 'Restaurant deactivated' : 'Restaurant activated',
        description: `The restaurant has been ${currentStatus ? 'deactivated' : 'activated'} successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update restaurant status.',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) {
      toast({
        title: 'Validation error',
        description: 'Name and slug are required.',
        variant: 'destructive',
      });
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newSlug)) {
      toast({
        title: 'Invalid slug',
        description: 'Slug can only contain lowercase letters, numbers, and hyphens.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createRestaurant.mutateAsync({
        name: newName.trim(),
        slug: newSlug.trim().toLowerCase(),
        plan: newPlan,
      });
      toast({
        title: 'Restaurant created',
        description: 'The restaurant has been created successfully.',
      });
      setIsCreateOpen(false);
      setNewName('');
      setNewSlug('');
      setNewPlan('starter');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create restaurant.',
        variant: 'destructive',
      });
    }
  };

  const getPlanBadgeVariant = (plan: PlanType) => {
    switch (plan) {
      case 'pro': return 'default';
      case 'growth': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Admin Panel</h1>
            </div>
            <p className="text-muted-foreground">Manage all restaurants on the platform</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Restaurant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Restaurant</DialogTitle>
                <DialogDescription>
                  Add a new restaurant to the platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="My Restaurant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="my-restaurant"
                  />
                  <p className="text-xs text-muted-foreground">
                    Customers will access at /r/{newSlug || 'my-restaurant'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan</Label>
                  <Select value={newPlan} onValueChange={(v) => setNewPlan(v as PlanType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createRestaurant.isPending}>
                  {createRestaurant.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : restaurants?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No restaurants yet. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                restaurants?.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell className="font-medium">{restaurant.name}</TableCell>
                    <TableCell>
                      <a 
                        href={`/r/${restaurant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        /r/{restaurant.slug}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPlanBadgeVariant(restaurant.plan)}>
                        {restaurant.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={restaurant.is_active ? 'default' : 'secondary'}>
                        {restaurant.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(restaurant.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={restaurant.is_active}
                          onCheckedChange={() => handleToggleActive(restaurant.id, restaurant.is_active)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
