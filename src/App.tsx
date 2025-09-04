import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { useAuth } from "./hooks/useAuth.tsx";
import { CartProvider } from "@/contexts/CartContext";
import { EmpresaProvider, useEmpresa } from "@/contexts/EmpresaContext";

// Importações de páginas e componentes
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import Orders from "./pages/Orders";
import Entregador from "./pages/Entregador";
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

// Componente para lidar com o redirecionamento com slug
const LoginRedirector = () => {
    const { slug } = useParams();
    return <Navigate to={`/login?redirectSlug=${slug}`} replace />;
};

// Componente para proteger rotas com base no papel e na empresa
const PrivateRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { currentUser, loading } = useAuth();
  const { empresa, loading: empresaLoading } = useEmpresa();

  if (loading || empresaLoading) {
    return <div className="h-screen w-full flex items-center justify-center">Carregando...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to={`/login${empresa?.slug ? `?redirectSlug=${empresa.slug}` : ''}`} replace />;
  }

  if (role && currentUser.role !== role) {
    console.error(`Tentativa de acesso não autorizado: Permissão '${role}' negada para o usuário '${currentUser.role}'.`);
    return <Navigate to="/unauthorized" replace />;
  }

  if (role === 'admin' && empresa && currentUser.id !== empresa.admin_id) {
    console.error("Tentativa de acesso não autorizado: O usuário não é o admin desta empresa.");
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        {/* AuthProvider deve encapsular tudo para que a autenticação seja global */}
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* ROTAS PÚBLICAS GLOBAIS - PRIORIDADE MÁXIMA */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin-register" element={<AdminRegister />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<NotFound />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />

              {/* ROTA AUXILIAR PARA REDIRECIONAMENTO COM SLUG */}
              <Route path="/:slug/login" element={<LoginRedirector />} />
              
              {/* ROTAS DO CARDÁPIO COM LAYOUT E CONTEXTO DE EMPRESA */}
              <Route path="/:slug" element={<EmpresaProvider><AppLayout /></EmpresaProvider>}>
                <Route index element={<Index />} />
                <Route path="orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
                <Route path="entregador" element={<PrivateRoute role="entregador"><Entregador /></PrivateRoute>} />
                <Route path="admin/*" element={<PrivateRoute role="admin"><Admin /></PrivateRoute>} />
                {/* Se você tiver outras rotas com slug, coloque-as aqui */}
                <Route path="cupons" element={<PrivateRoute role="admin"><AdminCupons /></PrivateRoute>} />
              </Route>
              
              {/* ROTA PADRÃO NA RAIZ (sem slug) */}
              <Route path="/" element={<AppLayout><Index /></AppLayout>} />

              {/* ROTA 404 - A ÚLTIMA A SER VERIFICADA */}
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
