import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardList, Settings, LogOut, ArrowLeft, Calculator, Percent, Users } from "lucide-react"; // Adicionado Users icon
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog, // Importado para o modal
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAuth } from "@/hooks/useAuth";
import { useProtectPage } from "@/hooks/useProtectPage";
import { useAuthState } from "@/hooks/useAuthState";
import { useEmpresa } from "@/hooks/useEmpresa";
import DelivererManagementModal from "@/components/DelivererManagementModal"; // Importa o novo componente do modal

const AdminDashboard = () => {
  useProtectPage("admin");

  const navigate = useNavigate();
  const { logOut } = useAuth();
  const { user } = useAuthState();
  const { empresa } = useEmpresa(user?.id ?? null); // <- agora está dentro do componente!

  const [isDelivererModalOpen, setIsDelivererModalOpen] = useState(false); // Estado para controlar a abertura do modal de entregadores

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Painel de Administração</h1>
          {empresa?.nome && (
            <p className="text-gray-600 text-lg mt-1">{empresa.nome}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Voltar ao Cardápio
          </Button>
          <Button
            onClick={logOut}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut size={16} />
            Sair
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Ver Pedidos</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os pedidos do restaurante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/admin-orders">Acessar Pedidos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <Settings className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Gerenciamento do Cardápio</CardTitle>
            <CardDescription>
              Gerencie categorias, itens do menu, grupos e variações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/admin">Gerenciar Cardápio</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
              <Calculator className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-xl">Ponto de Venda</CardTitle>
            <CardDescription>
              Acesse o sistema de ponto de venda para registrar pedidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/pdv">Acessar PDV</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-yellow-100 rounded-full w-fit">
              <Percent className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-xl">Cupons de Desconto</CardTitle>
            <CardDescription>
              Crie e gerencie cupons promocionais para seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/admin-coupons">Gerenciar Cupons</Link>
            </Button>
          </CardContent>
        </Card>

        {/* NOVO CARD: Gerenciamento de Entregadores */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
              <Users className="h-8 w-8 text-orange-600" /> {/* Ícone de usuários */}
            </div>
            <CardTitle className="text-xl">Gerenciar Entregadores</CardTitle>
            <CardDescription>
              Visualize, ative/desative e adicione entregadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsDelivererModalOpen(true)} className="w-full">
              Acessar Entregadores
            </Button>
          </CardContent>
        </Card>
        {/* FIM DO NOVO CARD */}

      </div>
      

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Bem-vindo, Administrador!</h2>
        <p className="text-gray-600">
          Use este painel para gerenciar todos os aspectos do seu restaurante.
          Você pode visualizar e atualizar pedidos, gerenciar o cardápio completo
          e acessar o sistema de PDV.
        </p>
      </div>

      {/* Modal de Gerenciamento de Entregadores */}
      <DelivererManagementModal
        isOpen={isDelivererModalOpen}
        onClose={() => setIsDelivererModalOpen(false)}
        empresaId={empresa?.id || null} // Passa o empresa_id para o modal
      />
    </div>
  );
};

export default AdminDashboard;
