import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurants, useCreateRestaurant, useOrders, useBookings } from '@/hooks/useRestaurant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  ChefHat, 
  Plus, 
  Menu, 
  Percent, 
  Grid3X3, 
  CalendarDays, 
  ShoppingCart,
  ExternalLink,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Restaurant } from '@/types/database';

function RestaurantStats({ restaurant }: { restaurant: Restaurant }) {
  const { data: orders } = useOrders(restaurant.id);
  const { data: bookings } = useBookings(restaurant.id);

  const newOrders = orders?.filter(o => o.status === 'new').length || 0;
  const todaysBookings = bookings?.filter(b => 
    b.booking_date === new Date().toISOString().split('T')[0]
  ).length || 0;
  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>New Orders</CardDescription>
          <CardTitle className="text-3xl">{newOrders}</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/pos" className="text-sm text-primary hover:underline flex items-center gap-1">
            View POS <ExternalLink className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Today's Bookings</CardDescription>
          <CardTitle className="text-3xl">{todaysBookings}</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/dashboard/bookings" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ExternalLink className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-3xl flex items-center gap-2">
            ${totalRevenue.toFixed(2)}
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-sm text-muted-foreground">All time</span>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: restaurants, isLoading } = useRestaurants();
  const createRestaurant = useCreateRestaurant();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const restaurant = restaurants?.[0];

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) {
      toast({
        title: 'Validation error',
        description: 'Name and slug are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createRestaurant.mutateAsync({
        name: newName.trim(),
        slug: newSlug.trim().toLowerCase(),
        owner_id: user?.id,
      });
      toast({
        title: 'Restaurant created!',
        description: 'Your restaurant is ready to set up.',
      });
      setShowCreate(false);
      setNewName('');
      setNewSlug('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create restaurant.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      pro: 'default',
      growth: 'secondary',
      starter: 'outline',
    };
    return <Badge variant={variants[plan] || 'outline'}>{plan}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {!restaurant ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center animate-fade-in">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <ChefHat className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-bold">Welcome to TableFlow</h1>
            <p className="mb-8 max-w-md text-muted-foreground">
              Create your first restaurant to start accepting online orders and table bookings.
            </p>
            <Button size="lg" onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              Create Restaurant
            </Button>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{restaurant.name}</h1>
                  {getPlanBadge(restaurant.plan)}
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <a 
                    href={`/r/${restaurant.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    /r/{restaurant.slug}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {!restaurant.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </p>
              </div>
            </div>

            <RestaurantStats restaurant={restaurant} />

            <div>
              <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link to="/dashboard/menu">
                  <Card className="card-hover cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                        <Menu className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">Menu</CardTitle>
                      <CardDescription>Manage menus and items</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
                <Link to="/dashboard/discounts">
                  <Card className="card-hover cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                        <Percent className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">Discounts</CardTitle>
                      <CardDescription>Create offers & coupons</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
                <Link to="/dashboard/tables">
                  <Card className="card-hover cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                        <Grid3X3 className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">Tables</CardTitle>
                      <CardDescription>Set up dine-in tables</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
                <Link to="/dashboard/bookings">
                  <Card className="card-hover cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                        <CalendarDays className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">Bookings</CardTitle>
                      <CardDescription>Manage reservations</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Link to="/pos">
                <Button size="xl" className="gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Open POS Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Your Restaurant</DialogTitle>
              <DialogDescription>
                Set up your restaurant to start accepting orders.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Amazing Restaurant"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="my-amazing-restaurant"
                />
                <p className="text-xs text-muted-foreground">
                  Customers will order at /r/{newSlug || 'my-restaurant'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createRestaurant.isPending}>
                {createRestaurant.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Restaurant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
