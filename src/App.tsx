// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
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
import AppLayout from "@/components/layouts/AppLayout"; // importa o layout
import AdminRegister from "./pages/AdminRegister";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <div className="h-screen w-full flex items-center justify-center">Carregando...</div>;

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin-register" element={<AdminRegister />} />
               <Route
                  path="/"
                  element={
                    <AppLayout>
                      <Index />
                    </AppLayout>
                }
              />
              {/* Todas essas rotas abaixo agora usam AppLayout + PrivateRoute */}
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

              <Route path="*" element={<NotFound />} />
            </Routes>
            <ShoppingCart />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
