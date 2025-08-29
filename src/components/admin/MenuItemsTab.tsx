import React, { useState, useEffect } from "react";
import { MenuItem, Category, Variation, VariationGroup } from "@/types/menu";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Edit, Plus, Trash2 } from "lucide-react";
import { deleteMenuItem } from "@/services/menuItemService";
import { EditMenuItemModal } from "./EditMenuItemModal";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

interface MenuItemsTabProps {
  menuItems: MenuItem[];
  categories: Category[];
  variations: Variation[];
  variationGroups: VariationGroup[];
  loading: boolean;
  onDataChange: () => void;
}

// Função auxiliar para construir a URL pública da imagem do Supabase
function getSupabaseImageUrl(filePath: string): string {
  if (!filePath) {
    return ""; // Retorna string vazia se o caminho não existir
  }
  const { data } = supabase.storage.from("menu_images").getPublicUrl(filePath);
  return data.publicUrl;
}

export const MenuItemsTab = ({
  menuItems,
  categories,
  variations,
  variationGroups,
  loading,
  onDataChange,
}: MenuItemsTabProps) => {
  const { toast } = useToast();
  const [editItem, setEditItem] = useState<MenuItem | null>(null);

  const handleAddItem = () => {
    const newItem: MenuItem = {
      id: "",
      name: "",
      description: "",
      price: 0,
      available: true,
      categoryId: null,
      variationGroups: [],
    };
    setEditItem(newItem);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditItem({ ...item });
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (window.confirm(`Tem certeza que deseja excluir o item "${item.name}"?`)) {
      try {
        await deleteMenuItem(item.id);
        toast({
          title: "Sucesso",
          description: "Item excluído com sucesso",
        });
        onDataChange();
      } catch (error) {
        toast({
          title: "Erro",
          description: `Não foi possível excluir o item: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Nenhuma";
  };

  const getVariationGroupName = (groupId: string): string => {
    const group = variationGroups.find((g) => g.id === groupId);
    return group ? group.name : "Grupo não encontrado";
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Itens do Menu</h2>
        <Button onClick={handleAddItem}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Item
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {menuItems.length > 0 ? (
          menuItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4 flex flex-col h-full">
                {/* Imagem do Item */}
                <div className="w-full h-32 bg-gray-200 rounded-md mb-2 overflow-hidden flex-shrink-0">
                  {/* === ALTERAÇÃO FEITA AQUI === */}
                  {item.image_path ? (
                    <img
                      src={getSupabaseImageUrl(item.image_path)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm text-center">
                      Sem imagem
                    </div>
                  )}
                </div>

                {/* Detalhes do Item */}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <p className="text-sm font-semibold text-green-600">
                      {formatCurrency(item.price)}
                    </p>
                    <div className="flex items-center mt-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full mr-2 ${
                          item.available ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span className="text-xs text-gray-500">
                        {item.available ? "Disponível" : "Indisponível"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      Categoria: {getCategoryName(item.categoryId)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Variações: {
                        item.variationGroups && item.variationGroups.length > 0
                          ? item.variationGroups.map(group => group.name).join(", ")
                          : "Nenhum"
                      }
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ID: {item.id}
                    </p>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end gap-2 mt-4 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditItem(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteItem(item)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          !loading && (
            <div className="col-span-full text-center py-8 text-gray-500">
              Nenhum item de menu encontrado.
            </div>
          )
        )}
      </div>

      {editItem && (
        <EditMenuItemModal
          editItem={editItem}
          setEditItem={setEditItem}
          categories={categories}
          variations={variations}
          variationGroups={variationGroups}
          onSuccess={onDataChange}
        />
      )}
    </>
  );
};
