// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom"; // Importe useParams
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { EmpresaProvider, useEmpresa } from "@/contexts/EmpresaContext"; // Importe useEmpresa
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


const queryClient = new QueryClient();

// Mantém PrivateRoute, mas garante que o `role` é tratado se necessário
// (Adicionei uma tipagem simples para 'role' caso você a use em PrivateRoute)
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

// Componente Wrapper para rotas com EmpresaProvider e CartProvider
// Isso é para lidar com o /:slug e fornecer o empresaId ao CartProvider
const EmpresaPageWrapper = () => {
  const { slug } = useParams<{ slug: string }>(); // Pega o slug da URL

  // Use o EmpresaProvider para carregar os dados da empresa e disponibilizar o empresaId
  return (
    <EmpresaProvider slug={slug}> {/* Passa o slug para o EmpresaProvider */}
      <EmpresaContent />
    </EmpresaProvider>
  );
};

// Componente que usa o contexto da Empresa para obter o empresaId
const EmpresaContent = () => {
  const { empresa, loading, error } = useEmpresa(); // Assume que useEmpresa te dá a empresa e o ID
  const empresaId = empresa?.id; // Assumindo que o objeto 'empresa' tem uma propriedade 'id'

  if (loading) return <AppLayout><div className="flex justify-center items-center h-64">Carregando empresa...</div></AppLayout>;
  if (error) return <AppLayout><div className="flex justify-center items-center h-64 text-red-500">Erro ao carregar empresa: {error.message}</div></AppLayout>;
  if (!empresaId) return <AppLayout><div className="flex justify-center items-center h-64">Empresa não encontrada ou ID inválido.</div></AppLayout>;


  return (
    // Agora o CartProvider está dentro do EmpresaProvider e recebe o empresaId
    // Isso garante que o carrinho e a lógica de cupom têm o ID da empresa correta
    <CartProvider empresaId={empresaId}> {/* <--- CartProvider recebe empresaId AQUI! */}
      <AppLayout>
        <Index /> {/* Renderiza o conteúdo da página Index para a empresa */}
      </AppLayout>
      <ShoppingCart /> {/* O ShoppingCart flutuante que aparece em páginas de empresa */}
    </CartProvider>
  );
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider> {/* AuthProvider mais externo */}
        {/*
          O CartProvider PRECISA DO empresaId.
          Para as rotas de administrador, podemos usar um empresaId fixo (o ID do seu projeto, onde os cupons admin vivem).
          Para as rotas de cliente (/:slug), o empresaId virá do EmpresaProvider.

          Removi o CartProvider daqui para movê-lo para dentro de EmpresaContent e PrivateRoute.
        */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* O checkout pode precisar do empresaId do CartProvider, então ele deve estar dentro do CartProvider */}
            <Route path="/checkout" element={<PrivateRoute><CartProvider empresaId={process.env.REACT_APP_SUPABASE_PROJECT_ID || 'fallback_admin_id'}><Checkout /></CartProvider></PrivateRoute>} /> {/* Adicionei um fallback empresaId aqui */}
            <Route path="/admin-register" element={<AdminRegister />} />
            <Route
              path="/"
              element={
                <AppLayout>
                  <Index />
                </AppLayout>
              }
            />

            {/* Rotas de Admin: usam o empresaId fixo do seu projeto Supabase (onde os cupons admin vivem) */}
            <Route
              path="/admin-coupons"
              element={
                <PrivateRoute role="admin">
                  {/* Passe o ID da sua empresa/projeto Supabase aqui, que é onde seus cupons de admin vivem */}
                  <CartProvider empresaId={process.env.REACT_APP_SUPABASE_PROJECT_ID || 'fallback_admin_id'}> {/* <--- ID FIXO AQUI */}
                    <AdminCupons />
                    <ShoppingCart /> {/* Renderiza o ShoppingCart para Admin Cupons se for necessário */}
                  </CartProvider>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <PrivateRoute>
                   <CartProvider empresaId={process.env.REACT_APP_SUPABASE_PROJECT_ID || 'fallback_admin_id'}>
                      <AppLayout>
                        <AdminDashboard />
                      </AppLayout>
                      <ShoppingCart />
                   </CartProvider>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                   <CartProvider empresaId={process.env.REACT_APP_SUPABASE_PROJECT_ID || 'fallback_admin_id'}>
                      <AppLayout>
                        <Admin />
                      </AppLayout>
                      <ShoppingCart />
                   </CartProvider>
                </PrivateRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <PrivateRoute>
                   <CartProvider empresaId={process.env.REACT_APP_SUPABASE_PROJECT_ID || 'fallback_admin_id'}>
                      <AppLayout>
                        <Orders />
                      </AppLayout>
                      <ShoppingCart />
                   </CartProvider>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin-orders"
              element={
                <PrivateRoute>
                   <CartProvider empresaId={process.env.REACT_APP_SUPABASE_PROJECT_ID || 'fallback_admin_id'}>
                      <AppLayout>
                        <AdminOrders />
                      </AppLayout>
                      <ShoppingCart />
                   </CartProvider>
                </PrivateRoute>
              }
            />
            <Route
              path="/entregador"
              element={
                <PrivateRoute>
                   <CartProvider empresaId={process.env.REACT_APP_SUPABASE_PROJECT_ID || 'fallback_admin_id'}>
                      <AppLayout>
                        <Entregador />
                      </AppLayout>
                      <ShoppingCart />
                   </CartProvider>
                </PrivateRoute>
              }
            />
            <Route
              path="/pdv"
              element={
                <PrivateRoute>
                   <CartProvider empresaId={process.env.REACT_APP_SUPABASE_PROJECT_ID || 'fallback_admin_id'}>
                      <AppLayout>
                        <PDV />
                      </AppLayout>
                      <ShoppingCart />
                   </CartProvider>
                </PrivateRoute>
              }
            />
            <Route
              path="/api/*"
              element={
                <PrivateRoute>
                   <CartProvider empresaId={process.env.REACT_APP_SUPABASE_PROJECT_ID || 'fallback_admin_id'}>
                      <AppLayout>
                        <Api />
                      </AppLayout>
                      <ShoppingCart />
                   </CartProvider>
                </PrivateRoute>
              }
            />
            {/* Rota de Cliente (Exemplo: /minha-empresa-slug) */}
            <Route
              path="/:slug"
              element={<EmpresaPageWrapper />} {/* <--- Usa o novo Wrapper aqui */}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
