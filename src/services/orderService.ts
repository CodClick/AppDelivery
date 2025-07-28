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

    // A partir de agora, o 'totalAmount' já vem calculado do frontend (finalTotal do CartContext)
    // O backend pode (e deve) ainda recalcular para fins de segurança e validação,
    // mas usaremos o que veio para salvar, presumindo que o front está correto.

    // Recalcular o total bruto dos itens (basePrice + variations) para fins de log/segurança se necessário
    // OBS: O `finalTotal` já é o `totalAmount` que o checkout está enviando.
    // Vamos manter a lógica de processamento dos itens para garantir que as variações salvas
    // contenham todos os dados necessários (nome, preço adicional) mesmo se não vierem do front.
    let calculatedSubtotal = 0; // Este é o total bruto dos itens
    const orderItems = await Promise.all(orderData.items.map(async item => {
      // Se o item tem preço "a partir de", o preço base para cálculo é 0
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

              // Se não tiver o preço, buscar no serviço (garante consistência no backend)
              if (additionalPrice === undefined && variation.variationId) {
                additionalPrice = await getVariationPrice(variation.variationId);
              }

              const processedVariation = {
                variationId: variation.variationId,
                quantity: variation.quantity || 1,
                name: variation.name || '',
                additionalPrice: additionalPrice || 0
              };

              // Calcular custo da variação para o subtotal
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

      calculatedSubtotal += currentItemCalculatedTotal; // Soma ao subtotal bruto

      return {
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price || 0, // Preço original do item (sem variações)
        quantity: item.quantity,
        selectedVariations: processedVariations,
        priceFrom: item.priceFrom || false
      };
    }));

    // Logs para comparação (opcional, pode ser removido em produção)
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
      // Salva o total final (com desconto) que veio do frontend
      total: orderData.totalAmount || calculatedSubtotal, // Usa o totalAmount do front, ou recalcula como fallback
      
      // --- NOVOS CAMPOS DO CUPOM E DESCONTO ---
      discountAmount: orderData.discountAmount || 0,
      couponCode: orderData.couponCode || null,
      couponType: orderData.couponType || null,
      couponValue: orderData.couponValue || null,
      // --- FIM DOS NOVOS CAMPOS ---

      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("\n=== SALVANDO PEDIDO NO FIRESTORE ===");
    console.log("Pedido a ser salvo:", JSON.stringify(orderToSave, null, 2));

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), orderToSave);

    console.log("Pedido salvo com ID:", docRef.id);

    return {
      id: docRef.id,
      ...orderToSave,
      createdAt: new Date().toISOString(), // Converte para string ISO para consistência
      updatedAt: new Date().toISOString()  // Converte para string ISO para consistência
    } as Order;
  } catch (error) {
    console.error("Erro ao criar pedido no service:", error);
    throw error;
  }
};

// ... (restante das funções: getOrderById, getOrdersByPhone, getTodayOrders, getOrdersByDateRange, updateOrder, formatTimestamp)
// Elas não precisam de grandes alterações a não ser que você queira que elas também retornem os campos de cupom.
// Se você for usar esses campos nos dashboards de pedidos, lembre-se de incluí-los na interface 'Order'.
// Por enquanto, apenas a função createOrder é a mais crítica para receber os dados.

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
      // Se você quiser que esses campos sejam retornados aqui,
      // a interface Order (em @/types/order) precisa ter esses campos.
      // Ex: discountAmount: orderData.discountAmount || 0,
      //     couponCode: orderData.couponCode || null,
      //     couponType: orderData.couponType || null,
      //     couponValue: orderData.couponValue || null,
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
        // Adicione aqui se quiser retornar os campos de cupom também
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
        // Adicione aqui se quiser retornar os campos de cupom também
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
        // Adicione aqui se quiser retornar os campos de cupom também
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
