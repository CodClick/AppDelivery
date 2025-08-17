// src/services/menuItemService.ts

import { supabase } from "@/lib/supabaseClient";
import { MenuItem } from "@/types/menu";

// Esta função agora busca os dados diretamente do Supabase.
// Ela aceita o 'empresaId' para garantir que os dados de cada empresa sejam isolados.
export const getAllMenuItems = async (empresaId: string): Promise<MenuItem[]> => {
  console.log("Buscando todos os itens do menu para o empresaId:", empresaId);

  // Se o empresaId não for válido, não fazemos a busca
  if (!empresaId) {
    console.error("empresaId não fornecido. Abortando a busca de itens do menu.");
    return [];
  }

  const { data, error } = await supabase
    .from('menu_items')
    .select(
      `
        id,
        name,
        description,
        price,
        image_url,
        is_popular,
        is_available,
        is_base_price_included,
        category:categories(id, name),
        item_variation_groups (
          variation_group_id,
          variation_group:variation_groups (
            id,
            name,
            min_selections,
            max_selections,
            group_variations (
              variation_id,
              variation:variations (
                id,
                name,
                price_adjustment,
                is_available
              )
            )
          )
        )
      `
    )
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: true }); // Ordena os itens por data de criação

  if (error) {
    console.error("Erro ao buscar itens do menu:", error);
    throw error; // Lança o erro para ser capturado no Admin.tsx
  }

  // Mapeia a estrutura do Supabase para a estrutura 'MenuItem' do seu app
  const mappedItems: MenuItem[] = data.map((item) => {
    // Mapeia a categoria
    const categoryName = Array.isArray(item.category) ? item.category[0]?.name : item.category?.name;
    const categoryId = Array.isArray(item.category) ? item.category[0]?.id : item.category?.id;

    // Mapeia os grupos de variação
    const variationGroups = (item.item_variation_groups || []).map((ivg: any) => {
      const group = ivg.variation_group;
      if (!group) return null;

      // Mapeia as variações dentro do grupo
      const variations = (group.group_variations || []).map((gv: any) => gv.variation);

      return {
        id: group.id,
        name: group.name,
        minRequired: group.min_selections,
        maxAllowed: group.max_selections,
        variations: variations.filter(v => v).map((v: any) => v.id),
        customMessage: "", // O Supabase não tem essa coluna, então usamos uma string vazia por enquanto
        variationsData: variations.filter(v => v).map((v: any) => ({
          id: v.id,
          name: v.name,
          price_adjustment: v.price_adjustment,
          available: v.is_available,
          categoryIds: [], // Este campo não está no Supabase, então deixamos como array vazio
        }))
      };
    }).filter(group => group);

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image_url || "",
      category: categoryId || "",
      popular: item.is_popular,
      hasVariations: (item.item_variation_groups || []).length > 0,
      variationGroups: variationGroups,
    };
  });

  return mappedItems;
};
