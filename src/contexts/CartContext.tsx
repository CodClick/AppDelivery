// src/contexts/CartContext.tsx
// Esta é a versão que deve estar AGORA no seu CartContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { CartItem, MenuItem, SelectedVariationGroup } from "@/types/menu";
import { toast } from "@/components/ui/use-toast";
import { getAllVariations } from "@/services/variationService";
import { supabase } from "@/lib/supabaseClient";

interface Coupon {
  id: string;
  nome: string;
  tipo: 'percentual' | 'fixo';
  valor: number;
  validade: string;
  descricao?: string;
  ativo: boolean;
  empresa_id: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addItem: (item: MenuItem & { selectedVariations?: SelectedVariationGroup[] }) => void;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  applyCoupon: (couponCode: string) => Promise<void>;
  appliedCoupon: Coupon | null;
  removeCoupon: () => void;
  discountAmount: number;
  finalTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Interface para as props do CartProvider (que agora espera empresaId)
interface CartProviderProps {
  children: ReactNode;
  empresaId: string | null; // <--- empresaId AGORA É OBRIGATÓRIO (ou null inicialmente)
}

export const CartProvider: React.FC<CartProviderProps> = ({ children, empresaId }) => { // <--- Recebe empresaId
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [variations, setVariations] = useState<any[]>([]);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number>(0);

  // Load all variations when the component mounts
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
  }, [cartItems, variations]);

  useEffect(() => {
    let calculatedFinalTotal = cartTotal - discountAmount;
    if (calculatedFinalTotal < 0) {
      calculatedFinalTotal = 0;
    }
    setFinalTotal(calculatedFinalTotal);
  }, [cartTotal, discountAmount]);

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

  const enrichSelectedVariations = (selectedVariations?: SelectedVariationGroup[]): SelectedVariationGroup[] => {
    if (!selectedVariations || selectedVariations.length === 0) {
      return [];
    }
    const enriched = selectedVariations.map(group => {
      const enrichedGroup = {
        ...group,
        variations: group.variations.map(variation => {
          const name = variation.name || getVariationName(variation.variationId);
          const additionalPrice = variation.additionalPrice !== undefined ? variation.additionalPrice : getVariationPrice(variation.variationId);
          return {
            ...variation,
            name,
            additionalPrice
          };
        })
      };
      return enrichedGroup;
    });
    return enriched;
  };

  const addItem = (menuItem: MenuItem & { selectedVariations?: SelectedVariationGroup[] }) => {
    const { selectedVariations, ...item } = menuItem;
    const enrichedVariations = enrichSelectedVariations(selectedVariations);
    const cartItemId = generateCartItemId(item, enrichedVariations);

    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        i => generateCartItemId(i, i.selectedVariations) === cartItemId
      );
      if (existingItemIndex >= 0) {
        return prevItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const newCartItem = {
          ...item,
          quantity: 1,
          selectedVariations: enrichedVariations
        };
        return [...prevItems, newCartItem];
      }
    });

    setAppliedCoupon(null);
    setDiscountAmount(0);

    toast({
      title: "Item adicionado",
      description: `${item.name} foi adicionado ao carrinho`,
      duration: 2000
    });
  };

  const addToCart = (item: MenuItem) => addItem(item);

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const increaseQuantity = (id: string) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
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
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const applyCoupon = useCallback(async (couponCode: string) => {
    // Agora verifica a prop empresaId
    if (!empresaId) {
      toast({
        title: "Erro ao aplicar cupom",
        description: "Não foi possível identificar a empresa para validar o cupom. (Empresa ID ausente na rota)",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from('cupons')
      .select('*')
      .eq('nome', couponCode.toUpperCase())
      .eq('ativo', true)
      .eq('empresa_id', empresaId) // Usa o empresaId da prop
      .single();

    if (error || !data) {
      toast({
        title: "Cupom inválido",
        description: "O código do cupom está incorreto ou o cupom não existe/não está ativo para esta empresa.",
        variant: "destructive",
      });
      setAppliedCoupon(null);
      setDiscountAmount(0);
      return;
    }

    const coupon: Coupon = data;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(coupon.validade);
    expiryDate.setHours(23, 59, 59, 999);

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

    let calculatedDiscount = 0;
    if (coupon.tipo === 'percentual') {
      calculatedDiscount = (cartTotal * coupon.valor) / 100;
    } else if (coupon.tipo === 'fixo') {
      calculatedDiscount = coupon.valor;
    }
    calculatedDiscount = Math.min(calculatedDiscount, cartTotal);

    setAppliedCoupon(coupon);
    setDiscountAmount(calculatedDiscount);

    toast({
      title: "Cupom aplicado!",
      description: `"${coupon.nome}" aplicado com sucesso.`,
    });

  }, [cartTotal, empresaId, toast]); // Dependências atualizadas

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
        cartItems, addItem, addToCart, removeFromCart, increaseQuantity,
        decreaseQuantity, clearCart, cartTotal, itemCount, isCartOpen,
        setIsCartOpen, applyCoupon, appliedCoupon, removeCoupon, discountAmount, finalTotal,
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
      
