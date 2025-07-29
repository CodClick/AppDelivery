// src/types/order.ts
import { Timestamp } from "firebase/firestore";

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }>;
  total: number;
  status: "pending" | "accepted" | "confirmed" | "preparing" | "ready" | "delivering" | "received" | "delivered" | "cancelled" | "to_deduct" | "paid";
  paymentMethod: string;
  paymentStatus: "a_receber" | "recebido";
  deliveryFee: number;
  notes?: string;
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
  discountAmount?: number;
  couponCode?: string;
  couponType?: "percentage" | "fixed";
  couponValue?: number;
  entregador_id?: string; // <--- Adicione esta linha aqui!
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
  observations?: string;
  totalAmount?: number; // O total final com desconto
  discountAmount?: number;
  couponCode?: string;
  couponType?: "percentage" | "fixed";
  couponValue?: number;
  entregador_id?: string; // <--- Adicione esta linha aqui!
}

export interface UpdateOrderRequest {
  status?: "pending" | "accepted" | "confirmed" | "preparing" | "ready" | "delivering" | "received" | "delivered" | "cancelled" | "to_deduct" | "paid";
  paymentStatus?: "a_receber" | "recebido";
  cancellationReason?: string;
  entregador_id?: string; // <--- Adicione esta linha aqui!
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
    productId: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }>;
  total?: number;
  paymentMethod?: string;
  deliveryFee?: number;
  notes?: string;
  discountAmount?: number;
  couponCode?: string;
  couponType?: "percentage" | "fixed";
  couponValue?: number;
}
