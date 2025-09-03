// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth.tsx";
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

// Componente que agrupa as rotas que precisam do EmpresaProvider
const EmpresaRoutes = () => {
  return (
    <EmpresaProvider>
      <AppLayout>
        <Routes>
          {/* Rotas de exibição (com slug) */}
          <Route path="/" element={<Index />} />
          <Route path="/:slug" element={<Index />} />
          {/* Rotas de Admin/usuário que dependem do EmpresaProvider */}
          <Route path="/admin" element={<PrivateRoute role="admin"><Admin /></PrivateRoute>} />
          <Route path="/admin-dashboard" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin-coupons" element={<PrivateRoute role="admin"><AdminCupons /></PrivateRoute>} />
          <Route path="/admin-orders" element={<PrivateRoute role="admin"><AdminOrders /></PrivateRoute>} />
          <Route path="/pdv" element={<PrivateRoute role="admin"><PDV /></PrivateRoute>} />
          <Route path="/api/*" element={<PrivateRoute role="admin"><Api /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/entregador" element={<PrivateRoute role="entregador"><Entregador /></PrivateRoute>} />
          {/* Rotas genéricas de erro (se necessário dentro do provedor) */}
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
              {/* Rotas públicas que não precisam do EmpresaProvider */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin-register" element={<AdminRegister />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<NotFound />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />

              {/* Rota para as páginas que precisam do EmpresaProvider */}
              <Route path="/*" element={<EmpresaRoutes />} />
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
