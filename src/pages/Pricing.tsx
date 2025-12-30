import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChefHat, Check, ArrowLeft } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '$29',
    description: 'Perfect for small restaurants just getting started',
    features: [
      'Up to 50 orders per month',
      'Basic POS dashboard',
      '1 menu with unlimited items',
      'Basic discounts',
      'Email support',
      'Customer ordering page',
    ],
  },
  {
    name: 'Growth',
    price: '$79',
    popular: true,
    description: 'For growing restaurants that need more power',
    features: [
      'Unlimited orders',
      'Full POS dashboard',
      'Multiple menus',
      'Coupons & discounts',
      'Table bookings',
      'Priority email support',
      'Custom branding',
      'Analytics dashboard',
    ],
  },
  {
    name: 'Pro',
    price: '$149',
    description: 'For established restaurants with high volume',
    features: [
      'Everything in Growth',
      'Advanced table management',
      'Advanced analytics',
      'API access',
      'Multi-location support',
      'Dedicated account manager',
      'Phone support',
      'Custom integrations',
    ],
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">TableFlow</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl animate-slide-up">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
            No commissions on orders. No hidden fees. Just a simple monthly subscription that grows with your business.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 transition-all animate-slide-up ${
                  plan.popular 
                    ? 'border-primary bg-card shadow-xl lg:scale-105 z-10' 
                    : 'border-border bg-card hover:border-primary/50 hover:shadow-lg'
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-lg">
                    Most Popular
                  </div>
                )}
                <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <Link to="/auth">
                  <Button 
                    className="w-full mb-8" 
                    size="lg"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto text-center">
            <h2 className="mb-4 text-2xl font-bold">Frequently asked questions</h2>
            <div className="mt-8 text-left space-y-6">
              <div className="rounded-lg border border-border p-6">
                <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                <p className="text-sm text-muted-foreground">Yes! All plans come with a 14-day free trial. No credit card required.</p>
              </div>
              <div className="rounded-lg border border-border p-6">
                <h3 className="font-semibold mb-2">Can I change plans later?</h3>
                <p className="text-sm text-muted-foreground">Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div className="rounded-lg border border-border p-6">
                <h3 className="font-semibold mb-2">Do you charge commission on orders?</h3>
                <p className="text-sm text-muted-foreground">No! Unlike other platforms, we charge zero commission. You keep 100% of your order revenue.</p>
              </div>
            </div>
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
