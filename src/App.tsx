// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Removido useParams
import { CartProvider } from "@/contexts/CartContext"; // CartProvider sem prop empresaId
import { AuthProvider } from "@/contexts/AuthContext";
// Removido EmpresaProvider e useEmpresa daqui, pois o CartProvider não precisa mais dele diretamente.
// Se você usa EmpresaProvider para outras coisas na sua Index, ele pode ficar onde estava na rota /:slug
import { useAuth } from "@/hooks/useAuth";
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
import { EmpresaProvider } from "@/contexts/EmpresaContext"; // Mantenha se ainda for usado na rota /:slug

const queryClient = new QueryClient();

const PrivateRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <div className="h-screen w-full flex items-center justify-center">Carregando...</div>;

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Lógica para verificar o role, se aplicável
  // if (role && currentUser.role !== role) { return <Navigate to="/unauthorized" /> }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider> {/* AuthProvider mais externo */}
        <CartProvider> {/* CartProvider agora ENVOLVE TUDO, sem precisar de prop empresaId */}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin-register" element={<AdminRegister />} />
              <Route path="/checkout" element={<Checkout />} /> {/* Checkout não precisa mais de CartProvider aninhado */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Rota inicial que usa AppLayout */}
              <Route
                path="/"
                element={
                  <AppLayout>
                    <Index />
                  </AppLayout>
                }
              />

              {/* Rotas de Admin e outras rotas privadas */}
              <Route
                path="/admin-coupons"
                element={
                  <PrivateRoute role="admin">
                    <AppLayout> {/* Mantenha AppLayout se AdminCupons precisa dele */}
                       <AdminCupons />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <AdminDashboard />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Admin />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Orders />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin-orders"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <AdminOrders />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/entregador"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Entregador />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/pdv"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <PDV />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/api/*"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Api />
                    </AppLayout>
                  </PrivateRoute>
                }
              />

              {/* Rota de Cliente para slug específico (se ela ainda precisar de EmpresaProvider) */}
              {/* Se o EmpresaProvider é apenas para carregar dados da empresa e não para passar para o CartProvider,
                  ele pode ficar aqui. Se ele precisa do slug da URL, ele deve usar useParams. */}
              <Route
                path="/:slug"
                element={
                  // Se Index usa useEmpresa, o EmpresaProvider deve envolvê-lo.
                  // O CartProvider já está globalmente disponível.
                  <EmpresaProvider>
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  </EmpresaProvider>
                }
              />

              {/* Rota de 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            {/* ShoppingCart global, agora com acesso ao CartContext corretamente */}
            <ShoppingCart />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
