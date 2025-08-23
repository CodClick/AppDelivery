import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CategoryNav from "@/components/CategoryNav";
import MenuSection from "@/components/MenuSection";
import RestaurantHeader from "@/components/RestaurantHeader";
import { categories, getMenuItemsByCategory as getLocalMenuItemsByCategory } from "@/data/menuData";
import { getAllCategories } from "@/services/categoryService";
import { getMenuItemsByCategory } from "@/services/menuItemService";
import { Category } from "@/types/menu";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, LogOut, Settings } from "lucide-react";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<string>("entradas");
  const [menuCategories, setMenuCategories] = useState<Category[]>(categories);
  const [menuItems, setMenuItems] = useState(getLocalMenuItemsByCategory("entradas"));
  const [refreshKey, setRefreshKey] = useState(0);
  const { currentUser, logOut } = useAuth();

  // Load data on component mount and when refreshKey changes
  useEffect(() => {
    loadData();
  }, [refreshKey]); 

  // Function to force refresh of all data
  const forceRefresh = () => {
    console.log("Forçando atualização de todos os dados...");
    setRefreshKey(prev => prev + 1);
  };

  const loadData = async () => {
    try {
      console.log("Carregando dados do menu...");
      
      // Try to get categories from Firebase
      const firebaseCategories = await getAllCategories();
      if (firebaseCategories.length > 0) {
        const sortedCategories = [...firebaseCategories].sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : 0;
          const orderB = b.order !== undefined ? b.order : 0;
          return orderA - orderB;
        });
        setMenuCategories(sortedCategories);
        
        // Set active category to the first category if available
        if (sortedCategories.length > 0 && sortedCategories[0]?.id) {
          setActiveCategory(sortedCategories[0].id);
          loadCategoryItems(sortedCategories[0].id);
        }
      } else {
        // Use local categories as fallback
        console.log("Using local categories as fallback");
        setMenuCategories(categories);
        setActiveCategory("entradas");
        setMenuItems(getLocalMenuItemsByCategory("entradas"));
      }
    } catch (error) {
      console.error("Error loading data, using local fallback:", error);
      // Use local data as complete fallback
      setMenuCategories(categories);
      setActiveCategory("entradas");
      setMenuItems(getLocalMenuItemsByCategory("entradas"));
    }
  };

  const loadCategoryItems = async (categoryId: string) => {
    try {
      const firebaseCategoryItems = await getMenuItemsByCategory(categoryId);
      if (firebaseCategoryItems.length > 0) {
        setMenuItems(firebaseCategoryItems);
      } else {
        // Always fallback to local data
        console.log(`Using local items for category ${categoryId}`);
        setMenuItems(getLocalMenuItemsByCategory(categoryId));
      }
    } catch (error) {
      console.error("Error loading category items, using local fallback:", error);
      // Always fallback to local data
      setMenuItems(getLocalMenuItemsByCategory(categoryId));
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    loadCategoryItems(categoryId);
  };

  // Listen for storage events to detect when admin makes changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'menuDataChanged') {
        console.log("Detectada mudança nos dados do menu, recarregando...");
        forceRefresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from the same tab
    const handleCustomEvent = () => {
      console.log("Evento customizado detectado, recarregando...");
      forceRefresh();
    };
    
    window.addEventListener('menuDataChanged', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('menuDataChanged', handleCustomEvent);
    };
  }, []);

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">Menu</h1>
        <div className="flex space-x-2">
          {currentUser ? (
            <>

              <Button onClick={logOut} variant="outline" className="flex items-center gap-2">
                <LogOut size={16} />
                Sair
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" className="flex items-center gap-2">
              <Link to="/login">
                <LogIn size={16} />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
      <RestaurantHeader />
      <CategoryNav 
        categories={menuCategories} 
        activeCategory={activeCategory} 
        onSelectCategory={handleSelectCategory} 
      />
      <MenuSection 
        title={menuCategories.find(cat => cat.id === activeCategory)?.name || ""}
        items={menuItems} 
      />
      {/* Seção "Mais Populares" temporariamente removida */}
    </div>
  );
};

export default Index;
