import React, { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getAllVariations, getVariationById } from "@/services/variationService";
import { Variation } from "@/types/menu";
import { Separator } from "@/components/ui/separator";

const ShoppingCart: React.FC = () => {
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    itemCount,
  } = useCart();
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [variations, setVariations] = useState<Variation[]>([]);
  const [variationsLoading, setVariationsLoading] = useState(true);

  // Load all variations when the component mounts
  useEffect(() => {
    const loadVariations = async () => {
      try {
        const allVariations = await getAllVariations();
        setVariations(allVariations);
      } catch (error) {
        console.error("Erro ao carregar variações:", error);
      } finally {
        setVariationsLoading(false);
      }
    };
    
    loadVariations();
  }, []);

  const handleCheckout = () => {
    if (!currentUser) {
      toast({
        title: "Login necessário",
        description: "Por favor, faça login para continuar com seu pedido",
        variant: "destructive",
      });
      setIsCartOpen(false);
      navigate("/login");
      return;
    }
    
    setIsCartOpen(false);
    navigate("/checkout");
  };

  // Determine if we're on the checkout page to adjust the cart button position
  const isCheckoutPage = window.location.pathname === "/checkout";

  // Don't show the cart button on the checkout page at all
  if (isCheckoutPage) {
    return null;
  }

  // Função para obter o nome da variação a partir do ID
  const getVariationName = (variationId: string): string => {
    // Procurar a variação no estado local
    const variation = variations.find(v => v.id === variationId);
    
    if (variation) {
      return variation.name;
    }
    
    // Se não encontrar (enquanto está carregando), retornar um placeholder
    return variationsLoading ? "Carregando..." : "Variação não encontrada";
  };

  // Função para obter o preço adicional da variação
  const getVariationPrice = (variationId: string): number => {
    const variation = variations.find(v => v.id === variationId);
    return variation?.additionalPrice || 0;
  };

  // Função para calcular o valor total das variações de um item
  const calculateVariationsTotal = (item: any): number => {
    let variationsTotal = 0;
    
    if (item.selectedVariations && item.selectedVariations.length > 0) {
      item.selectedVariations.forEach((group: any) => {
        if (group.variations && group.variations.length > 0) {
          group.variations.forEach((variation: any) => {
            const additionalPrice = getVariationPrice(variation.variationId);
            if (additionalPrice > 0) {
              variationsTotal += additionalPrice * (variation.quantity || 1);
            }
          });
        }
      });
    }
    
    return variationsTotal;
  };

  // Função para calcular o total do item (base + variações) x quantidade
  const calculateItemTotal = (item: any): number => {
    // Se o item tem "a partir de", o preço base é 0
    const basePrice = item.priceFrom ? 0 : (item.price || 0);
    const variationsTotal = calculateVariationsTotal(item);
    return (basePrice + variationsTotal) * item.quantity;
  };

  return (
    <>
      {/* Cart Trigger Button */}
      <button
        className="fixed bottom-6 right-6 z-30 bg-brand p-4 rounded-full shadow-lg hover:bg-brand-600 transition-all duration-300"
        onClick={() => setIsCartOpen(true)}
      >
        <div className="relative">
          <ShoppingBag className="h-6 w-6 text-white" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-food-green text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </div>
      </button>

      {/* Cart Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity",
          isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsCartOpen(false)}
      ></div>

      {/* Cart Slide Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full sm:w-96 bg-white z-50 p-6 shadow-xl overflow-y-auto transform transition-transform duration-300 ease-in-out",
          isCartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Seu Pedido</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">Seu carrinho está vazio</p>
            <p className="text-gray-400 text-sm text-center mt-2">Adicione itens do menu para começar seu pedido</p>
            <Button
              className="mt-6 bg-brand hover:bg-brand-600"
              onClick={() => setIsCartOpen(false)}
            >
              Ver Menu
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => {
                // Se o item tem "a partir de", o preço base é 0
                const basePrice = item.priceFrom ? 0 : (item.price || 0);
                const variationsTotal = calculateVariationsTotal(item);
                const itemTotal = calculateItemTotal(item);

                return (
                  <div key={item.id} className="flex border-b pb-4">
                    <div className="w-20 h-20 rounded overflow-hidden mr-4 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{item.name}</h3>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Preço base do item */}
                      <div className="text-sm text-gray-600">
                        {item.priceFrom ? (
                          <span>Item: <span className="text-xs text-gray-500">a partir de</span> {formatCurrency(0)}</span>
                        ) : (
                          <span>Item: {formatCurrency(basePrice)}</span>
                        )}
                      </div>
                      
                      {/* Variações selecionadas */}
                      {item.selectedVariations && item.selectedVariations.length > 0 && (
                        <div className="mt-2 text-sm">
                          {item.selectedVariations.map((group, index) => (
                            <div key={group.groupId || index} className="mb-1">
                              {group.groupName && (
                                <p className="font-medium text-xs text-gray-700">{group.groupName}:</p>
                              )}
                              {group.variations
                                .filter(v => v.quantity > 0)
                                .map(v => {
                                  const variationPrice = getVariationPrice(v.variationId);
                                  return (
                                    <div key={v.variationId} className="flex justify-between pl-2 text-xs text-gray-600">
                                      <span>{getVariationName(v.variationId)} x{v.quantity}</span>
                                      {variationPrice > 0 && (
                                        <span className="text-green-600 font-medium">
                                          +{formatCurrency(variationPrice * v.quantity)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })
                              }
                            </div>
                          ))}
                          
                          {/* Total das variações */}
                          {variationsTotal > 0 && (
                            <div className="text-xs text-green-600 font-medium border-t border-gray-200 pt-1">
                              Complementos/Adicionais: {formatCurrency(variationsTotal)}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Subtotal unitário */}
                      <div className="text-sm font-medium text-brand-600 mt-1">
                        Subtotal: {formatCurrency(basePrice + variationsTotal)}
                      </div>
                      
                      <div className="flex items-center mt-2">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          className="counter-btn"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="mx-2 w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item.id)}
                          className="counter-btn"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <div className="ml-auto font-bold">
                          {formatCurrency(itemTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <Button 
                className="w-full text-center py-3 bg-food-green hover:bg-opacity-90"
                onClick={handleCheckout}
              >
                Finalizar Pedido
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ShoppingCart;
