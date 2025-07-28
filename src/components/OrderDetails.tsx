// src/components/OrderDetails.tsx

import React from "react";
import { Order } from "@/types/order";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface OrderDetailsProps {
  order: Order;
  onUpdateStatus: (
    orderId: string,
    newStatus?: Order["status"],
    cancellationReason?: string,
    paymentStatus?: "a_receber" | "recebido"
  ) => void;
  // --- NOVOS PROPS PARA DETALHES DO CUPOM ---
  discountAmount?: number;
  couponCode?: string | null;
  couponType?: 'percentual' | 'fixo' | null;
  couponValue?: number | null;
  // --- FIM DOS NOVOS PROPS ---
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  onUpdateStatus,
  discountAmount = 0, // Adicionei um valor padrão para evitar undefined
  couponCode,
  couponType,
  couponValue,
}) => {
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
      paid: "Pago",
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusTranslated = (status: "a_receber" | "recebido" | undefined) => {
    if (!status) return "Não informado";
    return status === "a_receber" ? "A Receber" : "Recebido";
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Calcula o subtotal dos itens antes do desconto, se necessário
  // Isso pode ser útil para mostrar o "de" e "por"
  const calculateSubtotal = () => {
    let subtotal = 0;
    order.items.forEach(item => {
      let itemBasePrice = item.price || 0;
      if (item.priceFrom) {
        itemBasePrice = 0; // Se "a partir de", o preço base é 0 para o cálculo do subtotal inicial
      }
      let itemTotal = itemBasePrice * item.quantity;

      item.selectedVariations?.forEach(group => {
        group.variations.forEach(variation => {
          itemTotal += (variation.additionalPrice || 0) * (variation.quantity || 1);
        });
      });
      subtotal += itemTotal;
    });
    return subtotal;
  };

  const subtotalBeforeDiscount = calculateSubtotal();

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="font-semibold">Pedido ID:</p>
          <p>{order.id}</p>
        </div>
        <div>
          <p className="font-semibold">Data e Hora:</p>
          <p>{formatFullDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="font-semibold">Cliente:</p>
          <p>{order.customerName}</p>
        </div>
        <div>
          <p className="font-semibold">Telefone:</p>
          <p>{order.customerPhone}</p>
        </div>
        <div className="col-span-2">
          <p className="font-semibold">Endereço:</p>
          <p>{order.address}</p>
        </div>
        <div>
          <p className="font-semibold">Método de Pagamento:</p>
          <p>{order.paymentMethod === "card" ? "Cartão" : "Dinheiro"}</p>
        </div>
        <div>
          <p className="font-semibold">Status do Pedido:</p>
          <Select
            value={order.status}
            onValueChange={(value) => onUpdateStatus(order.id, value as Order["status"])}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="confirmed">Aceito</SelectItem>
              <SelectItem value="preparing">Em produção</SelectItem>
              <SelectItem value="ready">Pronto para Entrega</SelectItem>
              <SelectItem value="delivering">Saiu para entrega</SelectItem>
              <SelectItem value="received">Recebido</SelectItem>
              <SelectItem value="delivered">Entrega finalizada</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="font-semibold">Status do Pagamento:</p>
          <Select
            value={order.paymentStatus || "a_receber"} // Usa o status de pagamento do pedido ou "a_receber" como padrão
            onValueChange={(value) => onUpdateStatus(order.id, undefined, undefined, value as "a_receber" | "recebido")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status de Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a_receber">A Receber</SelectItem>
              <SelectItem value="recebido">Recebido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <p className="font-semibold">Observações:</p>
          <p>{order.observations || "Nenhuma observação."}</p>
        </div>
      </div>

      <Separator className="my-4" />

      <div>
        <h3 className="text-md font-semibold mb-2">Itens do Pedido:</h3>
        <ul className="space-y-2">
          {order.items.map((item, index) => (
            <li key={index} className="border p-3 rounded-md bg-gray-50">
              <p className="font-medium">
                {item.quantity}x {item.name} (R$ {item.price.toFixed(2)}{item.priceFrom ? " a partir de" : ""})
              </p>
              {item.selectedVariations && item.selectedVariations.length > 0 && (
                <div className="ml-4 text-xs text-gray-600">
                  {item.selectedVariations.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      <p className="font-semibold mt-1">{group.groupName}:</p>
                      <ul className="list-disc ml-4">
                        {group.variations.map((variation, varIndex) => (
                          <li key={varIndex}>
                            {variation.quantity}x {variation.name} (+ R$ {variation.additionalPrice.toFixed(2)})
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <Separator className="my-4" />

      {/* --- EXIBIÇÃO DO DESCONTO E CUPOM --- */}
      <div className="space-y-2">
        <p className="font-semibold">Resumo Financeiro:</p>
        <div className="flex justify-between">
          <p>Subtotal dos Itens:</p>
          <p>R$ {subtotalBeforeDiscount.toFixed(2)}</p>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-red-600">
            <p>Desconto Aplicado:</p>
            <p>- R$ {discountAmount.toFixed(2)}</p>
          </div>
        )}

        {couponCode && (
          <div className="flex justify-between text-gray-700 text-xs italic">
            <p>Cupom:</p>
            <p>{couponCode} ({couponType === 'percentual' ? `${couponValue}%` : `R$ ${couponValue}`})</p>
          </div>
        )}

        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
          <p>Total Final:</p>
          <p>R$ {order.total.toFixed(2)}</p>
        </div>
      </div>
      {/* --- FIM DA EXIBIÇÃO DO DESCONTO E CUPOM --- */}
    </div>
  );
};

export default OrderDetails;
