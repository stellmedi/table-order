import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/Layout';
import { useRestaurantBySlug, usePublicTables, useCreateBooking } from '@/hooks/useRestaurant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChefHat, 
  CalendarDays,
  Loader2,
  Check,
  Users,
  Clock,
  ShoppingCart,
  Phone,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const bookingSchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  customer_phone: z.string().min(10, 'Please enter a valid phone number').max(20),
  booking_date: z.string().min(1, 'Please select a date'),
  booking_time: z.string().min(1, 'Please select a time'),
  table_id: z.string().min(1, 'Please select a table'),
});

const timeSlots = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '17:00', '17:30', '18:00', '18:30', '19:00',
  '19:30', '20:00', '20:30', '21:00'
];

export default function CustomerBookTable() {
  const { slug } = useParams<{ slug: string }>();
  const { data: restaurant, isLoading: loadingRestaurant } = useRestaurantBySlug(slug || '');
  const { data: tables, isLoading: loadingTables } = usePublicTables(restaurant?.id || '');
  const createBooking = useCreateBooking();
  const { toast } = useToast();

  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [tableId, setTableId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      booking_date: date,
      booking_time: time,
      table_id: tableId,
    };

    const result = bookingSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    if (!restaurant) return;

    try {
      await createBooking.mutateAsync({
        restaurant_id: restaurant.id,
        ...data,
      });
      setBookingSuccess(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loadingRestaurant || loadingTables) {
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

  if (bookingSuccess) {
    return (
      <PublicLayout>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 text-accent mb-6">
            <Check className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Requested!</h1>
          <p className="text-lg text-muted-foreground mb-2 text-center">
            Your table booking at {restaurant.name} has been submitted
          </p>
          <p className="text-muted-foreground mb-8 text-center">
            The restaurant will confirm your reservation soon.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => setBookingSuccess(false)}>Book Another</Button>
            <Link to={`/r/${slug}`}>
              <Button variant="outline" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Order Food
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
            <Link to={`/r/${slug}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Order Online
              </Button>
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Book a Table</h1>
            <p className="text-muted-foreground">Reserve your spot at {restaurant.name}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reservation Details</CardTitle>
              <CardDescription>Fill in your information to book a table</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Your Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                    />
                    {errors.customer_name && (
                      <p className="text-sm text-destructive">{errors.customer_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.customer_phone && (
                      <p className="text-sm text-destructive">{errors.customer_phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={today}
                    />
                    {errors.booking_date && (
                      <p className="text-sm text-destructive">{errors.booking_date}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time
                    </Label>
                    <Select value={time} onValueChange={setTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {formatTime(slot)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.booking_time && (
                      <p className="text-sm text-destructive">{errors.booking_time}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Select Table
                  </Label>
                  {tables?.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No tables available for booking
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {tables?.map((table) => (
                        <button
                          key={table.id}
                          type="button"
                          onClick={() => setTableId(table.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            tableId === table.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Table {table.name_or_number}</span>
                            <Badge variant="secondary">
                              <Users className="h-3 w-3 mr-1" />
                              {table.capacity}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.table_id && (
                    <p className="text-sm text-destructive">{errors.table_id}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={createBooking.isPending || tables?.length === 0}
                >
                  {createBooking.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Book Table
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Your booking will be confirmed by the restaurant
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
