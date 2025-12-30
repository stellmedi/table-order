import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ChefHat, 
  ShoppingCart, 
  CalendarDays, 
  Percent, 
  LayoutDashboard,
  ArrowRight,
  Check
} from 'lucide-react';

const features = [
  {
    icon: ShoppingCart,
    title: 'Online Ordering',
    description: 'Accept pickup and dine-in orders directly from customers.',
  },
  {
    icon: LayoutDashboard,
    title: 'POS Dashboard',
    description: 'Manage orders with a tablet-friendly interface.',
  },
  {
    icon: Percent,
    title: 'Discounts & Coupons',
    description: 'Create flexible discounts for menus, items, or coupons.',
  },
  {
    icon: CalendarDays,
    title: 'Table Bookings',
    description: 'Let customers book dine-in tables online.',
  },
];

const plans = [
  {
    name: 'Starter',
    price: '$29',
    features: ['Up to 50 orders/month', 'Basic POS', '1 menu', 'Email support'],
  },
  {
    name: 'Growth',
    price: '$79',
    popular: true,
    features: ['Unlimited orders', 'Full POS', 'Multiple menus', 'Priority support', 'Coupons & discounts'],
  },
  {
    name: 'Pro',
    price: '$149',
    features: ['Everything in Growth', 'Table management', 'Advanced analytics', 'API access', 'Dedicated support'],
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">TableFlow</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center animate-slide-up">
            <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              Zero commission • Subscription-based
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Restaurant management
              <span className="text-gradient"> made simple</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Accept online orders, manage tables, create discounts, and run your restaurant efficiently with our all-in-one platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="xl" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="xl">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Everything you need</h2>
            <p className="text-lg text-muted-foreground">
              Powerful tools to run your restaurant smoothly
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Simple, transparent pricing</h2>
            <p className="text-lg text-muted-foreground">
              No commissions, no hidden fees
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 transition-all animate-slide-up ${
                  plan.popular 
                    ? 'border-primary bg-card shadow-lg scale-105' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="mb-2 text-xl font-semibold">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              <span className="font-semibold">TableFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 TableFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
