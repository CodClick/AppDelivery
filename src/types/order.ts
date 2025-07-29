// src/types/order.ts
import { Timestamp } from "firebase/firestore";

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  // Alterado de customerAddress para address para consistência com CreateOrderRequest
  address: { 
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: Array<{
    // Alterado de productId para menuItemId para consistência com CreateOrderRequest
    menuItemId: string; 
    name: string;
    price: number;
    quantity: number;
    notes?: string;
    // Adicionado priceFrom e selectedVariations para consistência com CreateOrderRequest
    priceFrom?: boolean; 
    selectedVariations?: Array<{
      groupId: string;
      groupName?: string;
      variations: Array<{
        variationId: string;
        name?: string;
        quantity?: number;
        additionalPrice?: number;
      }>;
    }>;
  }>;
  total: number;
  status: "pending" | "accepted" | "confirmed" | "preparing" | "ready" | "delivering" | "received" | "delivered" | "cancelled" | "to_deduct" | "paid";
  paymentMethod: string; // Mantido como string, conforme seu uso
  paymentStatus: "a_receber" | "recebido";
  deliveryFee?: number; // Mantido como opcional, conforme seu uso
  observations?: string; // Mantido como notes para consistência com seu uso
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
  discountAmount?: number;
  couponCode?: string;
  couponType?: "percentage" | "fixed";
  couponValue?: number;
  entregador_id?: string;
  empresa_id: string;

  // --- NOVO CAMPO PARA O HORÁRIO DE ENTREGA FINALIZADA ---
  deliveredAt?: string | Date | Timestamp; // Armazena o timestamp quando o status for 'delivered'
}

// Também atualize CreateOrderRequest e UpdateOrderRequest
export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    selectedVariations?: Array<{
      groupId: string;
      groupName?: string;
      variations: Array<{
        variationId: string;
        name?: string;
        quantity?: number;
        additionalPrice?: number;
      }>;
    }>;
    priceFrom?: boolean;
  }>;
  paymentMethod: string;
  observations?: string; // Alterado de notes para observations para consistência
  totalAmount?: number; // O total final com desconto
  discountAmount?: number;
  couponCode?: string;
  couponType?: "percentage" | "fixed";
  couponValue?: number;
  entregador_id?: string;
  empresa_id: string; // Adicionado empresa_id para consistência na criação
  paymentStatus: "a_receber" | "recebido"; // Adicionado paymentStatus para consistência na criação
}

export interface UpdateOrderRequest {
  status?: "pending" | "accepted" | "confirmed" | "preparing" | "ready" | "delivering" | "received" | "delivered" | "cancelled" | "to_deduct" | "paid";
  paymentStatus?: "a_receber" | "recebido";
  cancellationReason?: string;
  entregador_id?: string;
  // Outros campos que podem ser atualizados
  customerName?: string;
  customerPhone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items?: Array<{
    menuItemId: string; // Alterado de productId para menuItemId
    name: string;
    price: number;
    quantity: number;
    notes?: string;
    priceFrom?: boolean; // Adicionado priceFrom
    selectedVariations?: Array<{ // Adicionado selectedVariations
      groupId: string;
      groupName?: string;
      variations: Array<{
        variationId: string;
        name?: string;
        quantity?: number;
        additionalPrice?: number;
      }>;
    }>;
  }>;
  total?: number;
  paymentMethod?: string;
  deliveryFee?: number;
  observations?: string; // Alterado de notes para observations
  discountAmount?: number;
  couponCode?: string;
  couponType?: "percentage" | "fixed";
  couponValue?: number;
  // --- NOVO CAMPO PARA O HORÁRIO DE ENTREGA FINALIZADA ---
  deliveredAt?: string | Date | Timestamp; // Armazena o timestamp quando o status for 'delivered'
}
