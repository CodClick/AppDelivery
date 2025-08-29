import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { MenuItem, Category, Variation, VariationGroup } from "@/types/menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuItemsTab } from "@/components/admin/MenuItemsTab";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { VariationsTab } from "@/components/admin/VariationsTab";
import { VariationGroupsTab } from "@/components/admin/VariationGroupsTab";
import { Database } from "lucide-react";
import { SeedDataButton } from "@/components/admin/SeedDataButton";
import { supabase } from '@/lib/supabaseClient';

const Admin = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [variationGroups, setVariationGroups] = useState<VariationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("menu");
  
  // Função de carregamento agora recebe o ID da empresa como parâmetro
  const loadData = async (empresaId: string) => {
    if (!empresaId) {
      console.error("Não foi possível carregar os dados: empresaId não disponível.");
      toast({
        title: "Erro",
        description: "ID da empresa não encontrado para carregar os dados.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const queries = [
        supabase.from('categories').select('*').eq('empresa_id', empresaId),
        supabase.from('menu_items').select('*').eq('empresa_id', empresaId),
        supabase.from('variation_groups').select('*').eq('empresa_id', empresaId),
        supabase.from('variations').select('*').eq('empresa_id', empresaId)
      ];

      const [
        { data: categoriesData, error: categoriesError },
        { data: itemsData, error: itemsError },
        { data: variationGroupsData, error: variationGroupsError },
        { data: variationsData, error: variationsError }
      ] = await Promise.all(queries);

      if (categoriesError) throw categoriesError;
      if (itemsError) throw itemsError;
      if (variationGroupsError) throw variationGroupsError;
      if (variationsError) throw variationsError;

      setCategories(categoriesData || []);
      setMenuItems(itemsData || []);
      setVariationGroups(variationGroupsData || []);
      setVariations(variationsData || []);

      toast({
        title: "Sucesso",
        description: "Dados do cardápio carregados.",
        variant: "default",
      });

    } catch (error) {
      console.error("Admin: Erro ao carregar dados do Supabase:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do cardápio.",
        variant: "destructive",
      });
      setMenuItems([]);
      setCategories([]);
      setVariations([]);
      setVariationGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // O hook useAuth deve ser responsável por redirecionar se o usuário não estiver logado.
    // Aqui, apenas aguardamos o currentUser ser definido.
    if (currentUser === undefined) {
      setLoading(true); // Mostra o loading enquanto o estado de auth é resolvido
      return;
    }

    if (!currentUser) {
        navigate("/login");
        return;
    }

    const currentEmpresaId = currentUser.empresaId;

    if (currentEmpresaId) {
      loadData(currentEmpresaId);
    } else {
      console.error("Usuário autenticado não possui um ID de empresa associado.");
      toast({
        title: "Erro de Configuração",
        description: "Sua conta não está associada a nenhuma empresa.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [currentUser, navigate]);

  const handleDataChange = () => {
    if (currentUser?.empresaId) {
        loadData(currentUser.empresaId);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-x-hidden">
        {/* Header e botões */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">
            Gerenciamento do Cardápio
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* O SeedDataButton agora chama a função wrapper */}
            <SeedDataButton onDataChange={handleDataChange} />
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full sm:w-auto text-sm"
            >
              Voltar para o Cardápio
            </Button>
          </div>
        </div>

        {loading && <div className="text-center py-4 text-sm">Carregando dados...</div>}

        {/* Alerta para coleções vazias */}
        {!loading && (menuItems.length === 0 || categories.length === 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 mb-2">
              <Database className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <h3 className="font-medium text-yellow-800 text-sm sm:text-base">
                Dados do Cardápio Vazios
              </h3>
            </div>
            <p className="text-yellow-700 mb-3 text-xs sm:text-sm leading-relaxed">
              Parece que não há dados de cardápio para esta empresa.
              Use o botão "Importar Dados Iniciais" para popular o cardápio com um exemplo.
            </p>
          </div>
        )}

        {/* Tabs */}
        {!loading && (
            <Tabs defaultValue="menu" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 h-auto p-1">
                    <TabsTrigger value="menu" className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white">Itens</TabsTrigger>
                    <TabsTrigger value="categories" className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white">Categorias</TabsTrigger>
                    <TabsTrigger value="variations" className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white">Variações</TabsTrigger>
                    <TabsTrigger value="groups" className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white">Grupos</TabsTrigger>
                </TabsList>

                <div className="w-full overflow-x-hidden">
                    <TabsContent value="menu" className="mt-0">
                        <MenuItemsTab
                            menuItems={menuItems}
                            categories={categories}
                            variations={variations}
                            variationGroups={variationGroups}
                            loading={loading}
                            onDataChange={handleDataChange} // Passa a nova função
                        />
                    </TabsContent>
                    
                    <TabsContent value="categories" className="mt-0">
                        <CategoriesTab
                            categories={categories}
                            loading={loading}
                            onDataChange={handleDataChange}
                        />
                    </TabsContent>

                    <TabsContent value="variations" className="mt-0">
                        <VariationsTab
                            variations={variations}
                            categories={categories}
                            loading={loading}
                            onDataChange={handleDataChange}
                        />
                    </TabsContent>

                    <TabsContent value="groups" className="mt-0">
                        <VariationGroupsTab
                            variationGroups={variationGroups}
                            variations={variations}
                            loading={loading}
                            onDataChange={handleDataChange}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        )}
      </div>
    </div>
  );
};

export default Admin;
