
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
    console.log("=== CRIANDO PEDIDO ===");
    console.log("Dados do pedido recebidos:", JSON.stringify(orderData, null, 2));
    
    // Calcular o total e montar os itens do pedido
    let total = 0;
    const orderItems = await Promise.all(orderData.items.map(async item => {
      console.log(`\n--- PROCESSANDO ITEM: ${item.name} ---`);
      console.log("Item original:", JSON.stringify(item, null, 2));
      
      // Se o item tem preço "a partir de", não soma o preço base
      const basePrice = item.priceFrom ? 0 : (item.price || 0);
      let itemTotal = basePrice * item.quantity;
      console.log(`Preço base: R$ ${basePrice} x ${item.quantity} = R$ ${itemTotal}`);
      
      // Processar variações selecionadas
      let processedVariations = [];
      if (item.selectedVariations && Array.isArray(item.selectedVariations)) {
        console.log("Processando variações:", item.selectedVariations);
        
        for (const group of item.selectedVariations) {
          console.log(`Processando grupo: ${group.groupName || group.groupId}`);
          
          const processedGroup = {
            groupId: group.groupId,
            groupName: group.groupName || group.groupId,
            variations: []
          };
          
          if (group.variations && Array.isArray(group.variations)) {
            for (const variation of group.variations) {
              console.log(`Processando variação:`, variation);
              
              let additionalPrice = variation.additionalPrice;
              
              // Se não tiver o preço, buscar no serviço
              if (additionalPrice === undefined && variation.variationId) {
                additionalPrice = await getVariationPrice(variation.variationId);
                console.log(`Preço obtido do serviço para ${variation.variationId}: R$ ${additionalPrice}`);
              }
              
              const processedVariation = {
                variationId: variation.variationId,
                quantity: variation.quantity || 1,
                name: variation.name || '',
                additionalPrice: additionalPrice || 0
              };
              
              // Calcular custo da variação
              const variationCost = (additionalPrice || 0) * (variation.quantity || 1) * item.quantity;
              if (variationCost > 0) {
                itemTotal += variationCost;
                console.log(`Variação ${variation.name}: R$ ${additionalPrice} x ${variation.quantity} x ${item.quantity} = R$ ${variationCost}`);
              }
              
              processedGroup.variations.push(processedVariation);
            }
          }
          
          if (processedGroup.variations.length > 0) {
            processedVariations.push(processedGroup);
          }
        }
      }
      
      total += itemTotal;
      console.log(`Total do item ${item.name}: R$ ${itemTotal}`);
      console.log("Variações processadas:", JSON.stringify(processedVariations, null, 2));
      
      return {
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price || 0,
        quantity: item.quantity,
        selectedVariations: processedVariations,
        priceFrom: item.priceFrom || false
      };
    }));

    console.log("\n=== ITENS FINAIS DO PEDIDO ===");
    console.log(JSON.stringify(orderItems, null, 2));
    console.log(`Total final: R$ ${total}`);

    // Criar o documento do pedido
    const orderToSave = {
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      address: orderData.address,
      paymentMethod: orderData.paymentMethod,
      observations: orderData.observations || "",
      items: orderItems,
      status: "pending",
      total,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("\n=== SALVANDO PEDIDO ===");
    console.log("Pedido a ser salvo:", JSON.stringify(orderToSave, null, 2));

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), orderToSave);
    
    console.log("Pedido salvo com ID:", docRef.id);
    
    return {
      id: docRef.id,
      ...orderToSave,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Order;
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
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
      updatedAt: formatTimestamp(orderData.updatedAt)
    } as Order;
  } catch (error) {
    console.error("Erro ao obter pedido:", error);
    throw error;
  }
};

// Obter pedidos por número de telefone
export const getOrdersByPhone = async (phone: string): Promise<Order[]> => {
  try {
    const ordersCollection = collection(db, ORDERS_COLLECTION);
    const q = query(
      ordersCollection, 
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
        updatedAt: formatTimestamp(data.updatedAt)
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
    
    const ordersCollection = collection(db, ORDERS_COLLECTION);
    let q;
    
    if (status && status !== "all") {
      q = query(
        ordersCollection,
        where("createdAt", ">=", todayTimestamp),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        ordersCollection,
        where("createdAt", ">=", todayTimestamp),
        orderBy("createdAt", "desc")
      );
    }
    
    console.log("Executando consulta ao Firestore...");
    
    const ordersSnapshot = await getDocs(q);
    
    console.log("Resultados encontrados (total):", ordersSnapshot.size);
    
    let orders = ordersSnapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        ...data,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      } as Order;
    });
    
    if (status && status !== "all") {
      orders = orders.filter(order => order.status === status);
      console.log(`Resultados filtrados por status '${status}':`, orders.length);
    }
    
    return orders;
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
    
    const ordersCollection = collection(db, ORDERS_COLLECTION);
    
    const q = query(
      ordersCollection,
      where("createdAt", ">=", startTimestamp),
      where("createdAt", "<=", endTimestamp),
      orderBy("createdAt", "desc")
    );
    
    console.log("Executando consulta ao Firestore...");
    
    const ordersSnapshot = await getDocs(q);
    
    console.log("Resultados encontrados (total):", ordersSnapshot.size);
    
    let orders = ordersSnapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        ...data,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      } as Order;
    });
    
    if (status && status !== "all") {
      orders = orders.filter(order => order.status === status);
      console.log(`Resultados filtrados por status '${status}':`, orders.length);
    }
    
    return orders;
  } catch (error) {
    console.error("Erro ao obter pedidos por intervalo de datas:", error);
    throw error;
  }
};

// Atualizar um pedido
export const updateOrder = async (orderId: string, updates: UpdateOrderRequest): Promise<Order | null> => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) return null;
    
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    
    await updateDoc(orderRef, updateData);
    
    return getOrderById(orderId);
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    throw error;
  }
};

// Função auxiliar para formatar timestamps do Firestore
const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  if (typeof timestamp === 'string') return timestamp;
  
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  return new Date().toISOString();
};
