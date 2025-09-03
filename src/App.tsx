// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth.tsx";
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
import ShoppingCart from "./components/ShoppingCart";
import Checkout from "./pages/Checkout";
import AppLayout from "@/components/layouts/AppLayout";
import AdminRegister from "./pages/AdminRegister";
import AdminCupons from "@/pages/AdminCupons";
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { EmpresaProvider } from "@/contexts/EmpresaContext";
import OrderConfirmation from "./pages/OrderConfirmation";

const queryClient = new QueryClient();

// Mantém a PrivateRoute simples
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            {/* O EmpresaProvider envolve apenas as rotas que precisam dele */}
            <EmpresaProvider>
              <Routes>
                {/* Rotas de exibição que dependem do EmpresaProvider (com slug) */}
                <Route path="/" element={<AppLayout><Index /></AppLayout>} />
                <Route path="/:slug" element={<AppLayout><Index /></AppLayout>} />

                {/* Rotas de Admin/usuário que dependem do EmpresaProvider */}
                <Route path="/admin" element={<PrivateRoute role="admin"><AppLayout><Admin /></AppLayout></PrivateRoute>} />
                <Route path="/admin-dashboard" element={<PrivateRoute role="admin"><AppLayout><AdminDashboard /></AppLayout></PrivateRoute>} />
                <Route path="/admin-coupons" element={<PrivateRoute role="admin"><AppLayout><AdminCupons /></AppLayout></PrivateRoute>} />
                <Route path="/admin-orders" element={<PrivateRoute role="admin"><AppLayout><AdminOrders /></AppLayout></PrivateRoute>} />
                <Route path="/pdv" element={<PrivateRoute role="admin"><AppLayout><PDV /></AppLayout></PrivateRoute>} />
                <Route path="/api/*" element={<PrivateRoute role="admin"><AppLayout><Api /></AppLayout></PrivateRoute>} />
                <Route path="/orders" element={<PrivateRoute><AppLayout><Orders /></AppLayout></PrivateRoute>} />
                <Route path="/entregador" element={<PrivateRoute role="entregador"><AppLayout><Entregador /></AppLayout></PrivateRoute>} />
              </Routes>
            </EmpresaProvider>

            {/* Rotas públicas que não precisam do EmpresaProvider */}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin-register" element={<AdminRegister />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<NotFound />} />
              
              {/* Rota de confirmação de pedido fora do EmpresaProvider */}
              <Route path="/order-confirmation" element={<OrderConfirmation />} />

              {/* Rota 404 (deve ser a última) */}
              <Route path="*" element={<NotFound />} />
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
