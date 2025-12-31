import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import MenuManagement from "./pages/MenuManagement";
import DiscountsManagement from "./pages/DiscountsManagement";
import TablesManagement from "./pages/TablesManagement";
import BookingsManagement from "./pages/BookingsManagement";
import POS from "./pages/POS";
import CustomerOrder from "./pages/CustomerOrder";
import CustomerBookTable from "./pages/CustomerBookTable";
import WidgetTest from "./pages/WidgetTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/menu" element={<MenuManagement />} />
            <Route path="/dashboard/discounts" element={<DiscountsManagement />} />
            <Route path="/dashboard/tables" element={<TablesManagement />} />
            <Route path="/dashboard/bookings" element={<BookingsManagement />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/r/:slug" element={<CustomerOrder />} />
            <Route path="/r/:slug/book-table" element={<CustomerBookTable />} />
            <Route path="/widget-test" element={<WidgetTest />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
