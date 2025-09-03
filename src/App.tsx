// src/App.tsx
// Adicione o hook useParams
import { useParams, Navigate } from "react-router-dom";
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
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

              {/* ROTA DE REDIRECIONAMENTO PARA LOGIN COM SLUG */}
              <Route
                path="/:slug/login"
                element={<LoginRedirector />} // Use um novo componente auxiliar
              />
              
              {/* ROTAS DO CARDÁPIO E ADMIN COM LAYOUT E CONTEXTO - ANINHADAS DENTRO DE UM ÚNICO PAI */}
              <Route path="/:slug" element={<EmpresaProvider><AppLayout /></EmpresaProvider>}>
                <Route index element={<Index />} />
                <Route path="orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
                <Route path="entregador" element={<PrivateRoute role="entregador"><Entregador /></PrivateRoute>} />
                <Route path="admin/*" element={<PrivateRoute role="admin"><Admin /></PrivateRoute>} />
              </Route>
              
              {/* ROTA PADRÃO NA RAIZ (SEM SLUG) */}
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

// Novo componente para lidar com o redirecionamento com slug
const LoginRedirector = () => {
    const { slug } = useParams();
    return <Navigate to={`/login?redirectSlug=${slug}`} replace />;
};

export default App;
