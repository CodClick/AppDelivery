import React, { useState, useEffect } from "react";
import { getAllMenuItems } from "@/services/menuItemService";
import { getAllCategories } from "@/services/categoryService";
import { MenuItem, Category } from "@/types/menu";
import RestaurantHeader from "@/components/RestaurantHeader";
import CategoryNav from "@/components/CategoryNav";
import MenuSection from "@/components/MenuSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom"; // Importe useNavigate

const Index = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { itemCount, isCartOpen, setIsCartOpen } = useCart();
  const navigate = useNavigate(); // Inicialize useNavigate

  useEffect(() => {
    const loadMenuItems = async () => {
      const items = await getAllMenuItems();
      setMenuItems(items);
    };

    const loadCategories = async () => {
      const categories = await getAllCategories();
      setCategories([{ id: "all", name: "Todos", order: 0 }, ...categories]);
    };

    loadMenuItems();
    loadCategories();
  }, []);

  // Filtrar itens por categoria
  const filteredItems = activeCategory === "all"
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  // Agrupar itens filtrados por categoria para exibição
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
  }, [] as Array<{ category: Category; items: MenuItem[] }>);

  return (
    <div>
      {/* Container para o cabeçalho do restaurante e o botão de login */}
      <div className="flex justify-between items-center px-4 py-4">
        <RestaurantHeader />
        <Button
          onClick={() => navigate("/login")} // Navega para a página de login
          variant="default" // Ou "outline", "ghost" dependendo do estilo desejado
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Entrar
        </Button>
      </div>

      <CategoryNav 
        categories={categories} 
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />
      
      <div className="container mx-auto px-4 py-8">
        {activeCategory === "all" ? (
          // Mostrar todas as categorias com seus itens
          groupedItems.map(({ category, items }) => (
            <MenuSection 
              key={category.id}
              title={category.name} 
              items={items} 
            />
          ))
        ) : (
          // Mostrar apenas a categoria selecionada
          <MenuSection 
            title={categories.find(cat => cat.id === activeCategory)?.name || "Menu"} 
            items={filteredItems} 
          />
        )}
      </div>

      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsCartOpen(true)}
          className="bg-brand hover:bg-brand-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        >
          <ShoppingCart className="h-6 w-6" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Index;
