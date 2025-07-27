// src/contexts/CartContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CartItem, MenuItem, SelectedVariationGroup } from "@/types/menu";
import { toast } from "@/components/ui/use-toast";
import { getAllVariations } from "@/services/variationService";
import { supabase } from "@/lib/supabaseClient"; // Importe o Supabase
import { useAuth } from "@/hooks/useAuth"; // <--- NOVO: Importe o useAuth

// --- Nova Interface para o Cupom ---
interface Coupon {
  id: string;
  nome: string; // Código do cupom (e.g., "DESCONTO10")
  tipo: 'percentual' | 'fixo'; // "percentual" ou "fixo"
  valor: number; // Valor do desconto (e.g., 10 para 10% ou R$15,00)
  validade: string; // Data de validade no formato ISO (YYYY-MM-DD)
  descricao?: string; // Descrição opcional do cupom
  ativo: boolean; // Indica se o cupom está ativo
  empresa_id: string; // ID da empresa à qual o cupom pertence
}

// ... (suas interfaces CartItem, MenuItem, SelectedVariationGroup existentes)

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
  applyCoupon: (couponCode: string) => Promise<void>;
  appliedCoupon: Coupon | null;
  removeCoupon: () => void;
  discountAmount: number; // O valor monetário do desconto aplicado
  finalTotal: number; // O total final após o desconto
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Remova a interface CartProviderProps e a prop empresaId do CartProvider
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTotal, setCartTotal] = useState(0); // Este será o total ANTES do desconto
  const [itemCount, setItemCount] = useState(0);
  const [variations, setVariations] = useState<any[]>([]);

  // --- Novos estados para o cupom ---
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number>(0);

  // --- NOVO: Obter o usuário logado e empresa_id ---
  const { currentUser } = useAuth(); // Assume que useAuth fornece o usuário logado
  const [userEmpresaId, setUserEmpresaId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserEmpresaId = async () => {
      if (currentUser) {
        const { data, error } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('id', currentUser.id)
          .single();

        if (error) {
          console.error("Erro ao buscar empresa_id do usuário:", error.message);
          setUserEmpresaId(null);
        } else if (data) {
          setUserEmpresaId(data.empresa_id);
        }
      } else {
        setUserEmpresaId(null); // Limpa se o usuário deslogar
      }
    };

    fetchUserEmpresaId();
  }, [currentUser]); // Recarrega sempre que o currentUser mudar


  // ... (o restante do seu código existente no CartContext: loadVariations, getVariationPrice, etc.)
  // ... (calculateVariationsTotal)

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

    // Logs de debug, mantenha se desejar
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
  }, [cartItems, variations]);

  // useEffect para recalcular finalTotal quando cartTotal ou discountAmount mudam
  useEffect(() => {
    let calculatedFinalTotal = cartTotal - discountAmount;
    if (calculatedFinalTotal < 0) {
      calculatedFinalTotal = 0;
    }
    setFinalTotal(calculatedFinalTotal);
  }, [cartTotal, discountAmount]);

  // ... (funções generateCartItemId, enrichSelectedVariations, addItem, addToCart)
  // Certifique-se de que `addItem`, `removeFromCart`, `increaseQuantity`, `decreaseQuantity`, `clearCart`
  // AINDA contenham as linhas para `setAppliedCoupon(null); setDiscountAmount(0);` como no código anterior.

  // --- NOVO: Modifique a função applyCoupon para usar o userEmpresaId ---
  const applyCoupon = useCallback(async (couponCode: string) => {
    // 1. Verificar se há um usuário logado e se o empresaId foi carregado
    if (!currentUser) {
      toast({
        title: "Erro ao aplicar cupom",
        description: "Você precisa estar logado para aplicar um cupom.",
        variant: "destructive",
      });
      return;
    }

    if (!userEmpresaId) {
      toast({
        title: "Erro ao aplicar cupom",
        description: "Não foi possível carregar as informações da sua empresa. Tente novamente mais tarde.",
        variant: "destructive",
      });
      return;
    }

    // 2. Validar o cupom no Supabase
    const { data, error } = await supabase
      .from('cupons')
      .select('*')
      .eq('nome', couponCode.toUpperCase())
      .eq('ativo', true)
      .eq('empresa_id', userEmpresaId) // <--- USA O userEmpresaId AQUI!
      .single();

    if (error || !data) {
      toast({
        title: "Cupom inválido",
        description: "O código do cupom está incorreto ou o cupom não existe/não está ativo para sua empresa.",
        variant: "destructive",
      });
      setAppliedCoupon(null);
      setDiscountAmount(0);
      return;
    }

    const coupon: Coupon = data;

    // 3. Validação da data de validade
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

    // 4. Calcular o desconto
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

  }, [cartTotal, currentUser, userEmpresaId, toast]); // <--- ATUALIZE AS DEPENDÊNCIAS DO useCallback!

  // ... (o restante do seu CartContext, incluindo removeCoupon, etc.)

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
  
