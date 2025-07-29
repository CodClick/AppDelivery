// src/services/orderService.ts

import { collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, CreateOrderRequest, UpdateOrderRequest } from "@/types/order";
import { getAllVariations } from "@/services/variationService";

const ORDERS_COLLECTION = "orders";

// Função para obter o preço adicional da variação
const getVariationPrice = async (variationId: string): Promise<number> => {
  try {
    const variations = await getAllVariations();
    const variation = variations.find(v => v.id === variationId);
    return variation?.additionalPrice || 0;
  } catch (error) {
    console.error("Erro ao obter preço da variação:", error);
    return 0;
  }
};

// Criar um novo pedido
export const createOrder = async (orderData: CreateOrderRequest): Promise<Order> => {
  try {
    console.log("=== CRIANDO PEDIDO NO SERVICE ===");
    console.log("Dados do pedido recebidos (orderData):", JSON.stringify(orderData, null, 2));

    let calculatedSubtotal = 0;
    const orderItems = await Promise.all(orderData.items.map(async item => {
      const basePrice = item.priceFrom ? 0 : (item.price || 0);
      let currentItemCalculatedTotal = basePrice * item.quantity;

      let processedVariations = [];
      if (item.selectedVariations && Array.isArray(item.selectedVariations)) {
        for (const group of item.selectedVariations) {
          const processedGroup = {
            groupId: group.groupId,
            groupName: group.groupName || group.groupId,
            variations: []
          };

          if (group.variations && Array.isArray(group.variations)) {
            for (const variation of group.variations) {
              let additionalPrice = variation.additionalPrice;

              if (additionalPrice === undefined && variation.variationId) {
                additionalPrice = await getVariationPrice(variation.variationId);
              }

              const processedVariation = {
                variationId: variation.variationId,
                quantity: variation.quantity || 1,
                name: variation.name || '',
                additionalPrice: additionalPrice || 0
              };

              const variationCost = (additionalPrice || 0) * (variation.quantity || 1);
              if (variationCost > 0) {
                currentItemCalculatedTotal += variationCost * item.quantity;
              }

              processedGroup.variations.push(processedVariation);
            }
          }

          if (processedGroup.variations.length > 0) {
            processedVariations.push(processedGroup);
          }
        }
      }

      calculatedSubtotal += currentItemCalculatedTotal;

      return {
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price || 0,
        quantity: item.quantity,
        selectedVariations: processedVariations,
        priceFrom: item.priceFrom || false
      };
    }));

    console.log(`Subtotal calculado pelo service (bruto): R$ ${calculatedSubtotal.toFixed(2)}`);
    console.log(`Total final recebido do frontend (totalAmount): R$ ${orderData.totalAmount?.toFixed(2)}`);
    console.log(`Desconto recebido do frontend (discountAmount): R$ ${orderData.discountAmount?.toFixed(2)}`);

    // Criar o documento do pedido
    const orderToSave = {
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      address: orderData.address,
      paymentMethod: orderData.paymentMethod,
      observations: orderData.observations || "",
      items: orderItems,
      status: "pending",
      total: orderData.totalAmount || calculatedSubtotal,
      
      discountAmount: orderData.discountAmount || 0,
      couponCode: orderData.couponCode || null,
      couponType: orderData.couponType || null,
      couponValue: orderData.couponValue || null,
      entregador_id: orderData.entregador_id || null,
      // CORREÇÃO AQUI: Garante que empresa_id seja uma string ou null, nunca undefined
      empresa_id: orderData.empresa_id || null, 
      paymentStatus: orderData.paymentStatus || "a_receber", // Garante que paymentStatus seja salvo

      createdAt: serverTimestamp(), // Usa serverTimestamp
      updatedAt: serverTimestamp() // Usa serverTimestamp
    };

    console.log("\n=== SALVANDO PEDIDO NO FIRESTORE ===");
    console.log("Pedido a ser salvo:", JSON.stringify(orderToSave, null, 2));

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), orderToSave);

    console.log("Pedido salvo com ID:", docRef.id);

    // Para retornar o objeto Order completo com ID e Timestamps convertidos
    const newOrderSnap = await getDoc(docRef);
    const newOrderData = newOrderSnap.data() as Record<string, any>;

    return {
      id: newOrderSnap.id,
      ...newOrderData,
      createdAt: formatTimestamp(newOrderData.createdAt),
      updatedAt: formatTimestamp(newOrderData.updatedAt),
      // deliveredAt não estará presente na criação, mas é bom manter a consistência
      deliveredAt: formatTimestamp(newOrderData.deliveredAt) || undefined, 
    } as Order;
  } catch (error) {
    console.error("Erro ao criar pedido no service:", error);
    throw error;
  }
};

// Obter um pedido pelo ID
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) return null;
    
    const orderData = orderSnap.data() as Record<string, any>;
    return {
      id: orderSnap.id,
      ...orderData,
      createdAt: formatTimestamp(orderData.createdAt),
      updatedAt: formatTimestamp(orderData.updatedAt),
      deliveredAt: formatTimestamp(orderData.deliveredAt) || undefined, // Mapeia deliveredAt
      entregador_id: orderData.entregador_id || null,
      empresa_id: orderData.empresa_id || null,
    } as Order;
  } catch (error) {
    console.error("Erro ao obter pedido:", error);
    throw error;
  }
};

// Obter pedidos por número de telefone
export const getOrdersByPhone = async (phone: string): Promise<Order[]> => {
  try {
    const ordersCollectionRef = collection(db, ORDERS_COLLECTION); // Renomeado para evitar conflito
    const q = query( 
      ordersCollectionRef, 
      where("customerPhone", "==", phone),
      orderBy("createdAt", "desc")
    );
    
    const ordersSnapshot = await getDocs(q);
    return ordersSnapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        ...data,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
        deliveredAt: formatTimestamp(data.deliveredAt) || undefined, // Mapeia deliveredAt
        entregador_id: data.entregador_id || null,
        empresa_id: data.empresa_id || null,
      } as Order;
    });
  } catch (error) {
    console.error("Erro ao obter pedidos por telefone:", error);
    throw error;
  }
};

// Obter todos os pedidos de hoje com filtro opcional de status
export const getTodayOrders = async (status?: string): Promise<Order[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);
    
    console.log("Buscando pedidos para hoje:", today.toISOString());
    console.log("Status filtro:", status);
    
    const ordersCollectionRef = collection(db, ORDERS_COLLECTION); // Renomeado para evitar conflito
    let q;
    
    // A lógica de filtro por status aqui está um pouco redundante,
    // o filtro WHERE pode ser adicionado diretamente se status for diferente de "all"
    if (status && status !== "all") {
      q = query(
        ordersCollectionRef,
        where("createdAt", ">=", todayTimestamp),
        where("status", "==", status), // Adicionado filtro de status diretamente na query
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        ordersCollectionRef,
        where("createdAt", ">=", todayTimestamp),
        orderBy("createdAt", "desc")
      );
    }
    
    console.log("Executando consulta ao Firestore...");
    
    const ordersSnapshot = await getDocs(q);
    
    console.log("Resultados encontrados (total):", ordersSnapshot.size);
    
    return ordersSnapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        ...data,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
        deliveredAt: formatTimestamp(data.deliveredAt) || undefined, // Mapeia deliveredAt
        entregador_id: data.entregador_id || null,
        empresa_id: data.empresa_id || null,
      } as Order;
    });
  } catch (error) {
    console.error("Erro ao obter pedidos do dia:", error);
    throw error;
  }
};

// Nova função para obter pedidos por intervalo de datas e status opcional
export const getOrdersByDateRange = async (
  startDate: Date,
  endDate: Date,
  status?: string
): Promise<Order[]> => {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);
    
    console.log("Buscando pedidos no intervalo:", start.toISOString(), "até", end.toISOString());
    console.log("Status filtro:", status);
    
    const ordersCollectionRef = collection(db, ORDERS_COLLECTION); // Renomeado para evitar conflito
    
    let q = query(
      ordersCollectionRef,
      where("createdAt", ">=", startTimestamp),
      where("createdAt", "<=", endTimestamp),
      orderBy("createdAt", "desc")
    );
    
    if (status && status !== "all") {
      q = query(q, where("status", "==", status)); // Adicionado filtro de status diretamente na query
    }
    
    console.log("Executando consulta ao Firestore...");
    
    const ordersSnapshot = await getDocs(q);
    
    console.log("Resultados encontrados (total):", ordersSnapshot.size);
    
    return ordersSnapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        ...data,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
        deliveredAt: formatTimestamp(data.deliveredAt) || undefined, // Mapeia deliveredAt
        entregador_id: data.entregador_id || null,
        empresa_id: data.empresa_id || null,
      } as Order;
    });
  } catch (error) {
    console.error("Erro ao obter pedidos por intervalo de datas:", error);
    throw error;
  }
};

// Atualizar um pedido
export const updateOrder = async (orderId: string, updates: UpdateOrderRequest): Promise<Order | null> => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const currentOrderSnap = await getDoc(orderRef);
    
    if (!currentOrderSnap.exists()) return null;
    
    const currentOrder = currentOrderSnap.data() as Order; // Obtém os dados atuais do pedido

    const dataToUpdate: any = {
      ...updates,
      updatedAt: serverTimestamp() // Usa serverTimestamp para updatedAt
    };

    // Se o status está sendo alterado para 'delivered', registra o timestamp
    if (updates.status === "delivered" && currentOrder.status !== "delivered") {
      dataToUpdate.deliveredAt = serverTimestamp();
      console.log(`updateOrder: Registrando deliveredAt para o pedido ${orderId}.`);
    } else if (updates.status !== "delivered" && currentOrder.deliveredAt) {
      // Se o status for alterado de 'delivered' para outro, remove deliveredAt (opcional, mas boa prática)
      // Isso é importante se você quiser que deliveredAt só exista quando o status for 'delivered'
      dataToUpdate.deliveredAt = null; 
      console.log(`updateOrder: Removendo deliveredAt para o pedido ${orderId}.`);
    }
    
    await updateDoc(orderRef, dataToUpdate);
    
    // Retorna o pedido atualizado para manter o estado no frontend
    const updatedDocSnap = await getDoc(orderRef);
    const updatedData = updatedDocSnap.data() as Record<string, any>;

    return {
      id: updatedDocSnap.id,
      ...updatedData,
      createdAt: formatTimestamp(updatedData.createdAt),
      updatedAt: formatTimestamp(updatedData.updatedAt),
      deliveredAt: formatTimestamp(updatedData.deliveredAt) || undefined, // Mapeia deliveredAt
      entregador_id: updatedData.entregador_id || null,
      empresa_id: updatedData.empresa_id || null,
    } as Order;
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    throw error;
  }
};

// Função auxiliar para formatar timestamps do Firestore
const formatTimestamp = (timestamp: any): string | Timestamp | Date | undefined => {
  if (!timestamp) return undefined; // Retorna undefined se não houver timestamp

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate(); // Retorna um objeto Date
  }
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? undefined : date; // Tenta converter string para Date
  }
  if (timestamp instanceof Date) {
    return timestamp; // Já é um objeto Date
  }
  
  return undefined; // Para qualquer outro caso inesperado
};
