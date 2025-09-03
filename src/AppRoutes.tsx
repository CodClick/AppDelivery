import { Routes, Route, Navigate } from "react-router-dom";
import { EmpresaProvider } from "@/contexts/EmpresaContext";

// Importações de páginas e componentes
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import Orders from "./pages/Orders";
import AdminOrders from "./pages/AdminOrders";
import Entregador from "./pages/Entregador";
import PDV from "./pages/PDV";
import Api from "./pages/Api";
import NotFound from "./pages/NotFound";
import AppLayout from "@/components/layouts/AppLayout";
import AdminCupons from "./pages/AdminCupons";
import { PrivateRoute } from "./PrivateRoute"; // Crie este arquivo no próximo passo

const AppRoutes = () => {
  return (
    <Routes>
      {/* ROTA PADRÃO NA RAIZ (SEM SLUG) */}
      <Route path="/" element={<AppLayout><Index /></AppLayout>} />

      {/* ROTAS COM SLUG ANINHADAS */}
      <Route path="/:slug" element={<EmpresaProvider><AppLayout /></EmpresaProvider>}>
        <Route index element={<Index />} />
        <Route path="orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="entregador" element={<PrivateRoute role="entregador"><Entregador /></PrivateRoute>} />

        {/* ROTAS DE ADMIN */}
        <Route path="admin" element={<PrivateRoute role="admin"><Admin /></PrivateRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="coupons" element={<AdminCupons />} />
          <Route path="pdv" element={<PDV />} />
          <Route path="api/*" element={<Api />} />
        </Route>
      </Route>

      {/* ROTA 404 - A ÚLTIMA A SER VERIFICADA */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
