// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx"; // Importa o provedor
import { useAuth } from "./hooks/useAuth.tsx"; // Importa o hook
import { CartProvider } from "@/contexts/CartContext";
import { EmpresaProvider } from "@/contexts/EmpresaContext";

// Importações de páginas e componentes
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import Orders from "./pages/Orders";
import AdminOrders from "./pages/AdminOrders";
import Entregador from "./pages/Entregador";
import PDV from "./pages/PDV";
import Api from "./pages/Api";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import AdminRegister from "./pages/AdminRegister";
import AdminCupons from "@/pages/AdminCupons";
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AppLayout from "@/components/layouts/AppLayout";
import ShoppingCart from "./components/ShoppingCart";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

// Rota privada para verificar autenticação
const PrivateRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center">Carregando...</div>;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (role && currentUser.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
};

// Componente para rotas públicas (fora do EmpresaProvider)
const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-register" element={<AdminRegister />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<NotFound />} />
      <Route path="/order-confirmation" element={<OrderConfirmation />} />
      {/* Rota 404 para rotas públicas não encontradas */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Componente para rotas de Empresa e Admin (dentro do EmpresaProvider)
const CompanyAndAdminRoutes = () => {
  return (
    <EmpresaProvider>
      <AppLayout>
        <Routes>
          {/* Rotas de exibição (cardápio) */}
          <Route index element={<Index />} />
          <Route path="entregador" element={<PrivateRoute role="entregador"><Entregador /></PrivateRoute>} />
          <Route path="orders" element={<PrivateRoute><Orders /></PrivateRoute>} />

          {/* Rotas de Admin ANINHADAS sob a rota do slug */}
          <Route path="admin" element={<PrivateRoute role="admin"><Admin /></PrivateRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="coupons" element={<AdminCupons />} />
            <Route path="pdv" element={<PDV />} />
            <Route path="api/*" element={<Api />} />
            {/* Redirecionamento padrão para /admin */}
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
          
          {/* Rota de fallback para a empresa, se não for encontrada */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </EmpresaProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Rotas públicas na URL raiz */}
              <Route path="/*" element={<PublicRoutes />} />
              {/* Rotas com slug da empresa */}
              <Route path="/:slug/*" element={<CompanyAndAdminRoutes />} />
            </Routes>
            <ShoppingCart />
            <Toaster />
            <Sonner />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
