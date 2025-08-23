// src/components/RestaurantHeader.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// A prop "slug" será passada do componente pai
const RestaurantHeader = ({ slug }) => {
  const [restaurantData, setRestaurantData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
    // Retorna um placeholder ou esqueleto enquanto carrega
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

  // Define as variáveis de estilo CSS dinamicamente
  const brandColorStyle = {
    '--brand-color': restaurantData.cor_primaria || '#FF4500', // Padrão
    '--brand-secondary-color': restaurantData.cor_secundaria || '#FFA07A' // Padrão
  };

  return (
    <div className="relative" style={brandColorStyle}>
      <div className="h-48 sm:h-64 w-full bg-gradient-to-r from-[var(--brand-color)] to-[var(--brand-secondary-color)] overflow-hidden">
        {/* ... (restante do seu banner) */}
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
              <p className="text-gray-600 mt-1"><b>Sua Plataforma de Delivery</b></p>
              <div className="flex items-center justify-center sm:justify-start mt-2">
                {/* ... (restante das estrelas) */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantHeader;
