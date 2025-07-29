// src/pages/AdminOrders.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, orderBy, Timestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/types/order";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateOrder, getOrdersByDateRange } from "@/services/orderService";
import OrderDetails from "@/components/OrderDetails";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/DateRangePicker";

// Definindo um tipo básico para o entregador, assumindo que você tem um tipo User mais completo em outro lugar.
// Se você já tem um tipo User, pode importá-lo.
interface Deliverer {
  id: string;
  name: string;
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Novos estados para a seleção de entregador ---
  const [isDelivererSelectionModalOpen, setIsDelivererSelectionModalOpen] = useState(false);
  const [availableDeliverers, setAvailableDeliverers] = useState<Deliverer[]>([]);
  const [selectedDelivererId, setSelectedDelivererId] = useState<string>("");
  const [orderToAssignDeliverer, setOrderToAssignDeliverer] = useState<Order | null>(null);
  const [loadingDeliverers, setLoadingDeliverers] = useState(false); // Novo estado de carregamento para entregadores
  // --- Fim dos novos estados ---

  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: today
  });

  // Função para carregar os pedidos
  const loadOrders = async (status: string, dateRange: DateRange | undefined) => {
    console.log("loadOrders: Iniciando carregamento de pedidos...");
    try {
      setLoading(true);
      setError(null);

      if (!dateRange?.from) {
        console.log("loadOrders: Data inicial não definida. Limpando pedidos.");
        setOrders([]);
        setLoading(false);
        return;
      }

      const startDate = dateRange.from;
      const endDate = dateRange.to || dateRange.from;

      console.log(`loadOrders: Buscando pedidos de ${startDate.toLocaleDateString()} a ${endDate.toLocaleDateString()} com status '${status}'`);
      const orders = await getOrdersByDateRange(startDate, endDate, status === "all" ? undefined : status);
      setOrders(orders);
      console.log(`loadOrders: ${orders.length} pedidos carregados.`);
      setLoading(false);
    } catch (err) {
      console.error("loadOrders: Erro ao carregar pedidos:", err);
      setError("Não foi possível carregar os pedidos. Tente novamente.");
      setLoading(false);

      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para buscar entregadores ativos
  const fetchAvailableDeliverers = async () => {
    console.log("fetchAvailableDeliverers: Iniciando busca de entregadores...");
    setLoadingDeliverers(true); // Ativa o estado de carregamento
    try {
      if (!db) {
        console.error("fetchAvailableDeliverers: Instância do Firestore (db) não disponível.");
        throw new Error("Firestore DB not initialized.");
      }
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("role", "==", "entregador"),
        where("status", "==", "ativo") // Assumindo que você tem um campo 'status' para o entregador
      );
      const querySnapshot = await getDocs(q);
      const deliverers: Deliverer[] = [];
      querySnapshot.forEach((doc) => {
        deliverers.push({ id: doc.id, name: doc.data().name }); // Assumindo que o campo de nome é 'name'
      });
      setAvailableDeliverers(deliverers);
      if (deliverers.length > 0) {
        setSelectedDelivererId(deliverers[0].id); // Seleciona o primeiro por padrão
        console.log(`fetchAvailableDeliverers: ${deliverers.length} entregadores encontrados. Primeiro selecionado: ${deliverers[0].name}`);
      } else {
        setSelectedDelivererId("");
        console.log("fetchAvailableDeliverers: Nenhum entregador ativo encontrado.");
      }
    } catch (err) {
      console.error("fetchAvailableDeliverers: Erro ao buscar entregadores:", err);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os entregadores disponíveis.",
        variant: "destructive",
      });
    } finally {
      setLoadingDeliverers(false); // Desativa o estado de carregamento
    }
  };

  useEffect(() => {
    console.log("useEffect: Disparado devido a mudança de activeStatus ou dateRange.");
    loadOrders(activeStatus, dateRange);

    if (dateRange?.from) {
      console.log("useEffect: Configurando listener de snapshot para pedidos.");
      const start = new Date(dateRange.from);
      start.setHours(0, 0, 0, 0);

      const end = new Date(dateRange.to || dateRange.from);
      end.setHours(23, 59, 59, 999);

      const startTimestamp = Timestamp.fromDate(start);
      const endTimestamp = Timestamp.fromDate(end);

      const ordersRef = collection(db, "orders");
      const ordersQuery = query(
        ordersRef,
        where("createdAt", ">=", startTimestamp),
        where("createdAt", "<=", endTimestamp),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        ordersQuery,
        (snapshot) => {
          console.log("onSnapshot: Mudança detectada nos pedidos.");
          // Apenas recarrega se houver mudanças significativas ou se a dataRange for a mesma do carregamento inicial
          // Para evitar recarregamentos desnecessários em cada pequena alteração que não afeta o filtro.
          // Uma abordagem mais refinada seria atualizar apenas os pedidos específicos que mudaram.
          // Por simplicidade, para o propósito deste listener, vamos disparar o loadOrders completo se houver alguma mudança.
          if (!snapshot.empty) {
            console.log("onSnapshot: Snapshot não vazio, recarregando pedidos.");
            loadOrders(activeStatus, dateRange);
          }

          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              const createdAt = data.createdAt?.toDate() || new Date();
              const isRecent = (new Date().getTime() - createdAt.getTime()) < 10000;

              if (isRecent && data.status === "pending") {
                toast({
                  title: "Novo pedido recebido!",
                  description: `Cliente: ${data.customerName}`,
                });
                console.log(`onSnapshot: Novo pedido pendente detectado: ${data.customerName}`);
              }
            }
          });
        },
        (err) => {
          console.error("onSnapshot: Erro no listener:", err);
          toast({
            title: "Erro",
            description: "Não foi possível monitorar novos pedidos.",
            variant: "destructive",
          });
        }
      );

      return () => {
        console.log("useEffect cleanup: Desinscrevendo do listener de snapshot.");
        unsubscribe();
      };
    }
  }, [activeStatus, dateRange, toast]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    console.log("handleDateRangeChange: Nova faixa de data selecionada:", range);
    setDateRange(range);
  };

  const handleViewOrder = (order: Order) => {
    console.log("handleViewOrder: Visualizando detalhes do pedido:", order.id);
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus?: Order["status"],
    cancellationReason?: string,
    paymentStatus?: "a_receber" | "recebido"
  ) => {
    console.log(`handleUpdateOrderStatus: Tentando atualizar pedido ${orderId} para status ${newStatus || 'N/A'}`);
    try {
      // --- Lógica para seleção de entregador ---
      if (newStatus === "delivering" && selectedOrder?.status === "ready") {
        console.log("handleUpdateOrderStatus: Transição para 'delivering' detectada. Abrindo modal de seleção de entregador.");
        setOrderToAssignDeliverer(selectedOrder);
        await fetchAvailableDeliverers(); // Busca os entregadores antes de abrir o modal
        setIsDelivererSelectionModalOpen(true);
        return; // Interrompe a atualização normal do status por enquanto
      }
      // --- Fim da lógica para seleção de entregador ---

      // Preparar objeto de atualização
      const updateData: any = {};

      if (newStatus) {
        updateData.status = newStatus;
      }

      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus;
      }

      console.log("handleUpdateOrderStatus: Chamando updateOrder com dados:", updateData);
      const updatedOrder = await updateOrder(orderId, updateData);

      if (updatedOrder) {
        console.log("handleUpdateOrderStatus: Pedido atualizado com sucesso no Firestore.");
        // Atualizar a lista de pedidos
        setOrders(prev =>
          prev.map(order => order.id === orderId ? updatedOrder : order)
        );

        // Atualizar o pedido selecionado se for o mesmo
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updatedOrder);
        }

        const statusMessage = newStatus ?
          `Status alterado para ${translateStatus(newStatus)}` :
          paymentStatus ? `Status de pagamento alterado para ${paymentStatus === "recebido" ? "Recebido" : "A Receber"}` :
          "Pedido atualizado."; // Fallback message

        toast({
          title: "Pedido atualizado",
          description: statusMessage,
        });
      } else {
        console.warn("handleUpdateOrderStatus: updateOrder retornou null, pedido não encontrado ou não atualizado.");
        toast({
          title: "Aviso",
          description: "Pedido não encontrado ou não foi possível atualizar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("handleUpdateOrderStatus: Erro ao atualizar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pedido. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Nova função para atribuir o entregador e finalizar a atualização para "delivering"
  const handleAssignDelivererAndDeliver = async () => {
    console.log("handleAssignDelivererAndDeliver: Iniciando atribuição de entregador.");
    if (!orderToAssignDeliverer || !selectedDelivererId) {
      console.warn("handleAssignDelivererAndDeliver: Pedido ou entregador não selecionado.");
      toast({
        title: "Erro",
        description: "Selecione um entregador para continuar.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`handleAssignDelivererAndDeliver: Atribuindo pedido ${orderToAssignDeliverer.id} ao entregador ${selectedDelivererId}`);
      const updatedOrder = await updateOrder(orderToAssignDeliverer.id, {
        status: "delivering",
        entregador_id: selectedDelivererId, // Adiciona o ID do entregador
      });

      if (updatedOrder) {
        console.log("handleAssignDelivererAndDeliver: Pedido atualizado com entregador e status 'delivering'.");
        setOrders(prev =>
          prev.map(order => order.id === orderToAssignDeliverer.id ? updatedOrder : order)
        );

        if (selectedOrder && selectedOrder.id === orderToAssignDeliverer.id) {
          setSelectedOrder(updatedOrder);
        }

        toast({
          title: "Pedido atualizado",
          description: `Pedido ${orderToAssignDeliverer.id.substring(0, 6)} atribuído ao entregador e em rota de entrega.`,
        });

        setIsDelivererSelectionModalOpen(false); // Fecha o modal de seleção
        setOrderToAssignDeliverer(null); // Limpa o pedido em atribuição
        setSelectedDelivererId(""); // Limpa o entregador selecionado
      } else {
        console.warn("handleAssignDelivererAndDeliver: updateOrder retornou null após atribuição.");
        toast({
          title: "Aviso",
          description: "Não foi possível finalizar a atribuição do entregador.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("handleAssignDelivererAndDeliver: Erro ao atribuir entregador e atualizar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atribuir o entregador e atualizar o pedido. Tente novamente.",
        variant: "destructive",
      });
    }
  };


  const translateStatus = (status: Order["status"]) => {
    const statusMap: Record<Order["status"], string> = {
      pending: "Pendente",
      accepted: "Aceito",
      confirmed: "Aceito",
      preparing: "Em produção",
      ready: "Pronto para Entrega",
      delivering: "Saiu para entrega",
      received: "Recebido",
      delivered: "Entrega finalizada",
      cancelled: "Cancelado",
      to_deduct: "A descontar",
      paid: "Pago"
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed":
      case "accepted": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-purple-100 text-purple-800";
      case "ready": return "bg-green-100 text-green-800";
      case "delivering": return "bg-indigo-100 text-indigo-800"; // Cor diferente para "em rota"
      case "received":
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "to_deduct": return "bg-orange-100 text-orange-800";
      case "paid": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const statusOptions = [
    { value: "all", label: "Todos" },
    { value: "pending", label: "Pendentes" },
    { value: "confirmed", label: "Aceitos" },
    { value: "preparing", label: "Em Produção" },
    { value: "ready", label: "Prontos" },
    { value: "delivering", label: "Em Entrega" },
    { value: "received", label: "Recebidos" },
    { value: "delivered", label: "Finalizados" },
    { value: "cancelled", label: "Cancelados" },
    { value: "to_deduct", label: "A descontar" },
    { value: "paid", label: "Pagos" }
  ];

  const handleRetryLoad = () => {
    console.log("handleRetryLoad: Tentando recarregar pedidos.");
    loadOrders(activeStatus, dateRange);
  };

  // Calculate summary statistics
  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Pedidos</h1>
        <Button onClick={() => navigate("/admin-dashboard")} variant="outline">
          Página de Administração
        </Button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Filtrar por status:</label>
            <Select value={activeStatus} onValueChange={setActiveStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Filtrar por período:</label>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50 py-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Pedido #{order.id.substring(0, 6)}
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    {formatFullDate(order.createdAt as string)}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs flex items-center ${getStatusColor(order.status)}`}>
                  {translateStatus(order.status)}
                </span>
              </div>
              <div className="mt-2">
                <div className="font-semibold">{order.customerName}</div>
                <div className="text-sm text-gray-500">{order.customerPhone}</div>
                {order.entregador_id && (
                  <div className="text-xs text-gray-600 mt-1">
                    Entregador: {availableDeliverers.find(d => d.id === order.entregador_id)?.name || order.entregador_id}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Itens: {order.items.length}</p>
                <p className="font-medium">Total: R$ {order.total.toFixed(2)}</p>
                <Button
                  onClick={() => handleViewOrder(order)}
                  variant="outline"
                  className="w-full mt-2"
                >
                  Ver detalhes
                </Button>
                {/* Botão de "Marcar como Recebido" só aparece se o status não for "received" ou "delivered" */}
                {order.status !== "received" && order.status !== "delivered" && (
                  <Button
                    onClick={() => {
                      const novoStatus = order.status === "delivering" ? "delivered" : "delivered";
                      handleUpdateOrderStatus(order.id, novoStatus);
                    }}
                    variant="secondary"
                    className="w-full mt-2"
                  >
                    ✅ Marcar como Recebido
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg border-t-4 border-blue-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total de Pedido
