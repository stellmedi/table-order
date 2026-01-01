import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Menu, 
  Percent, 
  Grid3X3, 
  CalendarDays, 
  ShoppingCart,
  LogOut,
  ChefHat,
  Shield,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const ownerNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/menu', label: 'Menu', icon: Menu },
  { href: '/dashboard/discounts', label: 'Discounts', icon: Percent },
  { href: '/dashboard/tables', label: 'Tables', icon: Grid3X3 },
  { href: '/dashboard/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/pos', label: 'Live Orders', icon: ShoppingCart },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout({ children }: LayoutProps) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-border p-6">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">TableFlow</span>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {role === 'admin' && (
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  location.pathname === '/admin'
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Shield className="h-5 w-5" />
                Admin Panel
              </Link>
            )}
            
            {ownerNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-border p-4">
            <div className="mb-3 px-3">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{role || 'User'}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export function PublicLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
