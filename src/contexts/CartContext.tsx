import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CartItem, MenuItem, SelectedVariationGroup } from "@/types/menu";
import { toast } from "@/components/ui/use-toast"; // Assumindo que você usa o use-toast do shadcn/ui
import { getAllVariations } from "@/services/variationService";
import { supabase } from "@/lib/supabaseClient"; // Importe o Supabase

// --- Nova Interface para o Cupom ---
interface Coupon {
  id: string;
  nome: string; // Código do cupom (e.g., "DESCONTO10")
  tipo: 'percentual' | 'fixo'; // "percentual" ou "fixo"
  valor: number; // Valor do desconto (e.g., 10 para 10% ou 15.00 para R$15,00)
  validade: string; // Data de validade no formato ISO (YYYY-MM-DD)
  descricao?: string; // Descrição opcional do cupom
  ativo: boolean; // Indica se o cupom está ativo
  empresa_id: string; // ID da empresa à qual o cupom pertence
}

interface CartContextType {
  cartItems: CartItem[];
  addItem: (item: MenuItem & { selectedVariations?: SelectedVariationGroup[] }) => void;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  cartTotal: number; // Total bruto do carrinho (antes do cupom)
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  // --- Novas propriedades e funções para o cupom ---
  applyCoupon: (couponCode: string) => Promise<void>;
  appliedCoupon: Coupon | null;
  removeCoupon: () => void;
  discountAmount: number; // O valor monetário do desconto aplicado
  finalTotal: number; // O total final após o desconto
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTotal, setCartTotal] = useState(0); // Este será o total ANTES do desconto
  const [itemCount, setItemCount] = useState(0);
  const [variations, setVariations] = useState<any[]>([]);

  // --- Novos estados para o cupom ---
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number>(0); // Total final, incluindo desconto

  // Carregar variações para cálculos de preço
  useEffect(() => {
    const loadVariations = async () => {
      try {
        const allVariations = await getAllVariations();
        setVariations(allVariations);
      } catch (error) {
        console.error("Erro ao carregar variações:", error);
      }
    };

    loadVariations();
  }, []);

  // Função para obter o preço adicional da variação
  const getVariationPrice = (variationId: string): number => {
    const variation = variations.find(v => v.id === variationId);
    return variation?.additionalPrice || 0;
  };

  // Função para obter o nome da variação
  const getVariationName = (variationId: string): string => {
    const variation = variations.find(v => v.id === variationId);
    return variation?.name || '';
  };

  // Função para calcular o valor total das variações de um item
  const calculateVariationsTotal = (item: CartItem): number => {
    let variationsTotal = 0;

    if (item.selectedVariations && item.selectedVariations.length > 0) {
      item.selectedVariations.forEach(group => {
        if (group.variations && group.variations.length > 0) {
          group.variations.forEach(variation => {
            // Usa o additionalPrice que já veio no item do carrinho,
            // ou busca das variações carregadas se não estiver presente.
            const additionalPrice = variation.additionalPrice !== undefined ? variation.additionalPrice : getVariationPrice(variation.variationId);
            if (additionalPrice > 0) {
              variationsTotal += additionalPrice * (variation.quantity || 1);
            }
          });
        }
      });
    }

    return variationsTotal;
  };

  // useEffect para recalcular cartTotal e itemCount (o total BRUTO)
  useEffect(() => {
    const { total, count } = cartItems.reduce(
      (acc, item) => {
        const basePrice = item.priceFrom ? 0 : (item.price || 0);
        const variationsTotal = calculateVariationsTotal(item);
        const itemTotal = (basePrice + variationsTotal) * item.quantity;

        acc.total += itemTotal;
        acc.count += item.quantity;
        return acc;
      },
      { total: 0, count: 0 }
    );

    setCartTotal(total);
    setItemCount(count);

    // Log detalhado dos itens do carrinho para debug
    console.log("=== CART CONTEXT DEBUG ===");
    console.log("Itens no carrinho:", cartItems.length);
    cartItems.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, JSON.stringify(item, null, 2));
      if (item.selectedVariations && item.selectedVariations.length > 0) {
        console.log(`Variações do item ${index + 1}:`, item.selectedVariations);
      } else {
        console.log(`Item ${index + 1} SEM variações ou variações vazias`);
      }
    });
  }, [cartItems, variations]); // Depende de cartItems e variations

  // --- Novo useEffect para recalcular finalTotal quando cartTotal ou discountAmount mudam ---
  useEffect(() => {
    let calculatedFinalTotal = cartTotal - discountAmount;
    // Garante que o total final não seja negativo
    if (calculatedFinalTotal < 0) {
      calculatedFinalTotal = 0;
    }
    setFinalTotal(calculatedFinalTotal);
  }, [cartTotal, discountAmount]);

  // Função para gerar ID único para itens com variações
  const generateCartItemId = (item: MenuItem, selectedVariations?: SelectedVariationGroup[]): string => {
    if (!selectedVariations || selectedVariations.length === 0) {
      return item.id;
    }

    const variationsKey = selectedVariations
      .map(group => {
        const groupVariations = group.variations
          .filter(v => v.quantity > 0)
          .sort((a, b) => a.variationId.localeCompare(b.variationId))
          .map(v => `${v.variationId}-${v.quantity}`)
          .join('.');

        return `${group.groupId}:${groupVariations}`;
      })
      .sort()
      .join('_');

    return `${item.id}_${variationsKey}`;
  };

  // Função para enriquecer variações com dados completos (necessário para persistir preço e nome)
  const enrichSelectedVariations = (selectedVariations?: SelectedVariationGroup[]): SelectedVariationGroup[] => {
    console.log("=== ENRICHING VARIATIONS ===");
    console.log("Input selectedVariations:", selectedVariations);

    if (!selectedVariations || selectedVariations.length === 0) {
      console.log("Nenhuma variação para enriquecer");
      return [];
    }

    const enriched = selectedVariations.map(group => {
      console.log("Processando grupo:", group);

      const enrichedGroup = {
        ...group,
        variations: group.variations.map(variation => {
          const name = variation.name || getVariationName(variation.variationId);
          const additionalPrice = variation.additionalPrice !== undefined ? variation.additionalPrice : getVariationPrice(variation.variationId);

          console.log(`Variação ${variation.variationId}: nome="${name}", preço=${additionalPrice}`);

          return {
            ...variation,
            name,
            additionalPrice // Garante que o preço adicional seja salvo com a variação no carrinho
          };
        })
      };

      console.log("Grupo enriquecido:", enrichedGroup);
      return enrichedGroup;
    });

    console.log("Variações enriquecidas:", enriched);
    return enriched;
  };

  const addItem = (menuItem: MenuItem & { selectedVariations?: SelectedVariationGroup[] }) => {
    console.log("=== ADD ITEM TO CART ===");
    console.log("Item recebido:", menuItem);
    console.log("Variações recebidas:", menuItem.selectedVariations);

    const { selectedVariations, ...item } = menuItem;

    const enrichedVariations = enrichSelectedVariations(selectedVariations);

    console.log("Variações após enriquecimento:", enrichedVariations);

    const cartItemId = generateCartItemId(item, enrichedVariations);
    console.log("ID gerado para o item do carrinho:", cartItemId);

    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        i => generateCartItemId(i, i.selectedVariations) === cartItemId
      );

      if (existingItemIndex >= 0) {
        console.log("Item já existe no carrinho, incrementando quantidade");
        return prevItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        console.log("Adicionando novo item ao carrinho");
        const newCartItem = {
          ...item,
          quantity: 1,
          selectedVariations: enrichedVariations
        };

        console.log("Novo item criado:", JSON.stringify(newCartItem, null, 2));

        return [...prevItems, newCartItem];
      }
    });

    // --- Se o carrinho é modificado, remova o cupom aplicado ---
    setAppliedCoupon(null);
    setDiscountAmount(0);

    toast({
      title: "Item adicionado",
      description: `${item.name} foi adicionado ao carrinho`,
      duration: 2000
    });
  };

  // Alias para addItem para manter compatibilidade com código existente
  const addToCart = (item: MenuItem) => addItem(item);

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    // --- Se um item é removido, remova o cupom aplicado ---
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const increaseQuantity = (id: string) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
    // --- Se a quantidade é alterada, remova o cupom aplicado ---
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const decreaseQuantity = (id: string) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => !(item.id === id && item.quantity === 1))
    );
    // --- Se a quantidade é alterada, remova o cupom aplicado ---
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const clearCart = () => {
    setCartItems([]);
    // --- Limpa o cupom também ao limpar o carrinho ---
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  // --- Nova função para aplicar o cupom ---
  const applyCoupon = useCallback(async (couponCode: string) => {
    // Para validar o cupom, precisamos do ID da empresa.
    // Você pode obter o ID da empresa do usuário logado (se houver) ou de algum outro estado global.
    // Por enquanto, vou buscar o ID da empresa do primeiro item do carrinho,
    // ou você pode passar um `empresaId` para esta função se for mais adequado.
    // IMPORTANTE: Idealmente, o `empresaId` deveria vir de um contexto de usuário ou de configurações da empresa.
    // Para simplificar, vou assumir que todos os itens do carrinho pertencem à mesma empresa.
    const firstItem = cartItems[0];
    const empresaId = firstItem?.empresaId; // Assumindo que o item do carrinho tem `empresaId`

    if (!empresaId) {
      toast({
        title: "Erro ao aplicar cupom",
        description: "Não foi possível identificar a empresa para validar o cupom.",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from('cupons')
      .select('*')
      .eq('nome', couponCode.toUpperCase()) // Cupons geralmente são case-insensitive
      .eq('ativo', true) // Apenas cupons ativos
      .eq('empresa_id', empresaId) // Garante que o cupom é da empresa correta
      .single();

    if (error || !data) {
      toast({
        title: "Cupom inválido",
        description: "O código do cupom está incorreto ou o cupom não existe/não está ativo.",
        variant: "destructive",
      });
      setAppliedCoupon(null);
      setDiscountAmount(0);
      return;
    }

    const coupon: Coupon = data;

    // Validação da data de validade
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data
    const expiryDate = new Date(coupon.validade);
    expiryDate.setHours(23, 59, 59, 999); // Define para o final do dia de validade

    if (today > expiryDate) {
      toast({
        title: "Cupom expirado",
        description: "Este cupom não é mais válido.",
        variant: "destructive",
      });
      setAppliedCoupon(null);
      setDiscountAmount(0);
      return;
    }

    // Calcular o desconto
    let calculatedDiscount = 0;
    if (coupon.tipo === 'percentual') {
      calculatedDiscount = (cartTotal * coupon.valor) / 100;
    } else if (coupon.tipo === 'fixo') {
      calculatedDiscount = coupon.valor;
    }

    // Garantir que o desconto não seja maior que o total do carrinho
    calculatedDiscount = Math.min(calculatedDiscount, cartTotal);

    setAppliedCoupon(coupon);
    setDiscountAmount(calculatedDiscount);

    toast({
      title: "Cupom aplicado!",
      description: `"${coupon.nome}" aplicado com sucesso.`,
    });

  }, [cartTotal, cartItems, toast]); // Depende do cartTotal e cartItems para validações futuras

  // --- Nova função para remover o cupom ---
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    toast({
      title: "Cupom removido",
      description: "O cupom foi removido do seu pedido.",
    });
  }, [toast]);


  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItem,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        cartTotal,
        itemCount,
        isCartOpen,
        setIsCartOpen,
        // --- Novas propriedades no contexto ---
        applyCoupon,
        appliedCoupon,
        removeCoupon,
        discountAmount,
        finalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
                                                      
