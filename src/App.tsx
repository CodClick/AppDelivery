// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext.tsx";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <EmpresaProvider>
              <Routes>
                {/* Rotas Públicas (NÃO ENVOLVIDAS POR LAYOUT, POIS NÃO DEPENDEM DO CONTEXTO) */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin-register" element={<AdminRegister />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/unauthorized" element={<NotFound />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />

                {/* Rotas de Empresa/Admin (ENVOLVIDAS POR LAYOUT E PROVIDER) */}
                <Route element={<AppLayout />}>
                    <Route index element={<Index />} /> {/* Rota para o cardápio raiz */}
                    <Route path="/:slug" element={<Index />} /> {/* Rota do cardápio com slug */}
                    <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
                    <Route path="/entregador" element={<PrivateRoute role="entregador"><Entregador /></PrivateRoute>} />

                    {/* Rotas de Admin ANINHADAS sob a rota do slug, para manter a hierarquia */}
                    <Route path="/:slug/admin" element={<PrivateRoute role="admin"><Admin /></PrivateRoute>}>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="coupons" element={<AdminCupons />} />
                        <Route path="pdv" element={<PDV />} />
                        <Route path="api/*" element={<Api />} />
                        <Route index element={<Navigate to="dashboard" replace />} />
                    </Route>
                </Route>

                {/* Rota 404 - A ÚLTIMA A SER VERIFICADA */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </EmpresaProvider>
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
