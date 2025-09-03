import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MenuItem, Category } from "@/types/menu";
import RestaurantHeader from "@/components/RestaurantHeader";
import CategoryNav from "@/components/CategoryNav";
import MenuSection from "@/components/MenuSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useParams } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import { useEmpresa } from "@/contexts/EmpresaContext"; // Importe o hook do contexto da empresa

// Componente principal da página de cardápio
const Index = () => {
    // Usando o contexto para obter os dados da empresa
    const { empresa: empresaData, loading: isLoading, error: empresaError } = useEmpresa();
    
    // Removi as lógicas de fetch de empresa, pois agora o EmpresaProvider faz isso
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState("all");
    const { slug } = useParams();
    const { itemCount, isCartOpen, setIsCartOpen } = useCart();
    
    // Adicionando logs para depuração
    console.log("------------------------------------------");
    console.log("Componente Index está renderizando.");
    console.log("Empresa (via contexto):", empresaData);
    console.log("Loading (via contexto):", isLoading);
    console.log("Error (via contexto):", empresaError);
    console.log("------------------------------------------");

    useEffect(() => {
        const loadMenuData = async () => {
            // Apenas carrega os dados do menu se a empresa for carregada
            if (!empresaData) {
                return;
            }

            try {
                const empresaId = empresaData.id;
                
                // 1. Buscar as categorias da empresa
                const { data: categoriesData, error: categoriesError } = await supabase
                    .from('categories')
                    .select('id, name, display_order')
                    .eq('empresa_id', empresaId)
                    .order('display_order', { ascending: true });

                if (categoriesError) throw new Error(categoriesError.message);
                
                const formattedCategories = categoriesData.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    order: cat.display_order
                }));
                const categoriesWithAll = [{ id: "all", name: "Todos", order: 0 }, ...formattedCategories];
                setCategories(categoriesWithAll);

                // 2. Buscar os itens do menu da empresa
                const { data: menuItemsData, error: itemsError } = await supabase
                    .from('menu_items')
                    .select(`
                        id,
                        name,
                        description,
                        price,
                        image_url,
                        category_id
                    `)
                    .eq('empresa_id', empresaId);

                if (itemsError) throw new Error(itemsError.message);

                const formattedItems = menuItemsData.map(item => ({
                    ...item,
                    category: item.category_id
                }));
                setMenuItems(formattedItems);

            } catch (err) {
                console.error('Erro ao carregar dados do menu:', err);
            }
        };

        loadMenuData();
    }, [empresaData]); // Dependência alterada para empresaData

    const filteredItems = activeCategory === "all"
        ? menuItems
        : menuItems.filter(item => item.category === activeCategory);

    const groupedItems = categories.reduce((acc, category) => {
        if (category.id === "all") return acc;
        
        const categoryItems = filteredItems.filter(item => item.category === category.id);
        if (categoryItems.length > 0) {
            acc.push({
                category,
                items: categoryItems
            });
        }
        return acc;
    }, []);

    if (isLoading) {
        return (
            <div>
                <div className="relative animate-pulse">
                    <div className="h-48 sm:h-64 w-full bg-gray-300"></div>
                    <div className="container mx-auto px-4 relative -mt-16 sm:-mt-24 z-10 mb-6">
                        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col sm:flex-row items-center">
                            <div className="w-24 h-24 rounded-full bg-gray-400 mr-0 sm:mr-6 mb-4 sm:mb-0"></div>
                            <div className="text-center sm:text-left">
                                <Skeleton className="h-6 w-48 mb-2" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container mx-auto px-4 py-4 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (empresaError || !empresaData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
                <h1 className="text-2xl font-bold text-gray-800">Oops! Empresa não encontrada.</h1>
                <p className="mt-2 text-gray-600">Verifique se o endereço está correto ou tente novamente mais tarde.</p>
            </div>
        );
    }
    
    return (
        <div>
            <RestaurantHeader {...empresaData} />
            
            <CategoryNav
                categories={categories}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
            />
            
            <div className="container mx-auto px-4 py-8">
                {activeCategory === "all" ? (
                    groupedItems.map(({ category, items }) => (
                        <MenuSection
                            key={category.id}
                            title={category.name}
                            items={items}
                        />
                    ))
                ) : (
                    <MenuSection
                        title={categories.find(cat => cat.id === activeCategory)?.name || "Menu"}
                        items={filteredItems}
                    />
                )}
            </div>

            {itemCount > 0 && (
                <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
                    <Button
                        className="w-full max-w-sm rounded-full text-lg h-14 shadow-lg animate-bounce-custom"
                        onClick={() => setIsCartOpen(true)}
                    >
                        <ShoppingCart className="mr-2" />
                        Ver Carrinho <Badge variant="secondary" className="ml-2 bg-white text-brand-500 font-bold px-2 py-1">({itemCount})</Badge>
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Index;
