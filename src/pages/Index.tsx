// src/pages/Index.tsx

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
// Assumindo que o `useParams` do react-router-dom está disponível
import { useParams } from 'react-router-dom';

/**
 * Busca todas as categorias de uma empresa a partir do slug.
 * @param {string} slug O slug da empresa.
 * @returns {Promise<Category[]>} Uma promessa que resolve para um array de categorias.
 */
async function getAllCategories(slug) {
  try {
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id')
      .eq('slug', slug)
      .single();

    if (empresaError || !empresa) {
      console.error('Empresa não encontrada:', empresaError?.message || 'Empresa com slug não encontrada.');
      return [];
    }

    const empresaId = empresa.id;

    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        order
      `)
      .eq('empresa_id', empresaId)
      .order('order', { ascending: true });

    if (error) {
      console.error('Erro ao buscar categorias:', error.message);
      return [];
    }
    
    const categoriesWithAll = [{ id: "all", name: "Todos", order: 0 }, ...data];
    return categoriesWithAll;

  } catch (err) {
    console.error('Erro inesperado em getAllCategories:', err);
    return [];
  }
}

/**
 * Busca todos os itens de menu de uma empresa a partir do slug.
 * @param {string} slug O slug da empresa.
 * @returns {Promise<MenuItem[]>} Uma promessa que resolve para um array de itens de menu.
 */
async function getAllMenuItems(slug) {
  try {
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id')
      .eq('slug', slug)
      .single();

    if (empresaError || !empresa) {
      console.error('Empresa não encontrada:', empresaError?.message || 'Empresa com slug não encontrada.');
      return [];
    }

    const empresaId = empresa.id;

    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        category (
          id,
          name
        )
      `)
      .eq('empresa_id', empresaId);

    if (error) {
      console.error('Erro ao buscar itens de menu:', error.message);
      return [];
    }

    const formattedItems = data.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      category: item.category?.id
    }));

    return formattedItems;

  } catch (err) {
    console.error('Erro inesperado em getAllMenuItems:', err);
    return [];
  }
}

// Lógica para buscar dados dinâmicos do cabeçalho do restaurante
const RestaurantHeaderWithData = () => {
  const [restaurantData, setRestaurantData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { slug } = useParams();

  useEffect(() => {
    async function fetchRestaurantData() {
      if (!slug) return;
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          nome, 
          logo_url, 
          cor_primaria,
          cor_secundaria
        `)
        .eq('slug', slug)
        .single();
        
      if (error) {
        console.error("Erro ao buscar dados do restaurante:", error.message);
      } else {
        setRestaurantData(data);
      }
      setIsLoading(false);
    }
    
    fetchRestaurantData();
  }, [slug]);

  if (isLoading || !restaurantData) {
    return (
      <div className="relative animate-pulse">
        <div className="h-48 sm:h-64 w-full bg-gray-300"></div>
        <div className="container mx-auto px-4 relative -mt-16 sm:-mt-24 z-10 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col sm:flex-row items-center">
            <div className="w-24 h-24 rounded-full bg-gray-400 mr-0 sm:mr-6 mb-4 sm:mb-0"></div>
            <div className="text-center sm:text-left">
              <div className="h-6 w-48 bg-gray-400 rounded mb-2"></div>
              <div className="h-4 w-64 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const brandColorStyle = {
    '--brand-color': restaurantData.cor_primaria || '#FF4500',
    '--brand-secondary-color': restaurantData.cor_secundaria || '#FFA07A'
  };

  return (
    <div className="relative" style={brandColorStyle}>
      <div className="h-48 sm:h-64 w-full bg-gradient-to-r from-[var(--brand-color)] to-[var(--brand-secondary-color)] overflow-hidden">
        <img
          src="/images/restaurant-banner.jpg"
          alt="Sabor Delivery Fácil"
          className="w-full h-full object-cover mix-blend-overlay opacity-50"
          onError={(e) => {
            const target = e.target;
            target.src = "/placeholder.svg";
          }}
        />
      </div>
      <div className="container mx-auto px-4 relative -mt-16 sm:-mt-24 z-10 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md mr-0 sm:mr-6 mb-4 sm:mb-0">
              <img
                src={restaurantData.logo_url}
                alt={`Logo ${restaurantData.nome}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target;
                  target.src = "/placeholder.svg";
                }}
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{restaurantData.nome}</h1>
              <p className="text-gray-600 mt-1">Delivery Facil e Rápido</p>
              <p className="text-600 mt-1"><b>Sua Plataforma de Delivery</b></p>
              <div className="flex items-center justify-center sm:justify-start mt-2">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-600 ml-2">4.8 (120+)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal da página de cardápio
const Index = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const { itemCount, isCartOpen, setIsCartOpen } = useCart();
  const { slug } = useParams();

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;
      const loadedCategories = await getAllCategories(slug);
      const loadedItems = await getAllMenuItems(slug);

      setCategories(loadedCategories);
      setMenuItems(loadedItems);
    };

    loadData();
  }, [slug]);

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

  return (
    <div>
      <RestaurantHeaderWithData />
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
    </div>
  );
};

export default Index;
