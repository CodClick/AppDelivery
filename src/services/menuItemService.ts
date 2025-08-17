// src/services/menuItemService.ts

import { supabase } from "@/lib/supabaseClient"; // Seu cliente Supabase
import { MenuItem, Category, Variation, VariationGroup } from "@/types/menu";

// --- Funções de Ajuda para Mapeamento (Opcional, mas útil) ---
// Supabase/PostgreSQL retorna snake_case. Se seus tipos TS usam camelCase,
// você pode ter funções para converter, ou fazer isso diretamente nos tipos como mostrei.
// Para este exemplo, assumirei que a maioria dos campos diretos são snake_case no DB
// e vamos mapeá-los se necessário. Supabase pode mapear automaticamente em SELECT.

// --- Funções para Obter Dados ---

/**
 * Obtém todos os itens do menu para uma empresa específica.
 * Inclui dados relacionados de categoria e grupos de variação/variações.
 * @param empresaId O UUID da empresa para filtrar os dados.
 */
export const getAllMenuItems = async (empresaId: string): Promise<MenuItem[]> => {
  // A consulta `select` com strings como 'category(*)' fará um JOIN implícito.
  // 'variation_groups!item_variation_groups(variation_group_id, variation_groups(*))'
  // é uma sintaxe para JOINs através de tabelas de junção.
  // 'variations!group_variations(variation_id, variations(*))' é para as variações dentro dos grupos.

  // NOTA: A sintaxe exata para JOINs complexos (muitos-para-muitos) no Supabase
  // pode ser um pouco diferente dependendo da versão e se você usa RLS.
  // Vamos tentar uma abordagem mais explícita para garantir.

  const { data: menuItemsData, error } = await supabase
    .from('menu_items')
    .select(
      `
      id,
      name,
      description,
      price,
      image_url,
      is_base_price_included,
      is_available,
      empresa_id,
      created_at,
      category:categories(id, name, display_order), -- Carrega a categoria relacionada
      item_variation_groups( -- Tabela de junção entre item e grupo de variação
        variation_groups( -- O grupo de variação real
          id,
          name,
          min_selections,
          max_selections,
          group_variations( -- Tabela de junção entre grupo e variações
            variations( -- A variação real
              id,
              name,
              price_adjustment
            )
          )
        )
      )
      `
    )
    .eq('empresa_id', empresaId) // FILTRA PELA EMPRESA
    .order('name', { ascending: true }); // Ordena por nome, ajuste se tiver outra lógica

  if (error) {
    console.error("Erro ao buscar itens do menu:", error.message);
    throw new Error("Não foi possível carregar os itens do menu.");
  }

  // O Supabase retorna os dados aninhados. Pode ser necessário um pouco de pós-processamento
  // para formatar os dados exatamente como seus componentes esperam, especialmente
  // para os arrays de variation_groups e variações dentro deles.

  const processedMenuItems: MenuItem[] = menuItemsData.map((item: any) => {
    // Mapeia a estrutura de retorno do Supabase para seus tipos TypeScript
    // Note que Supabase aninha via o nome da tabela de junção.
    const mappedVariationGroups: VariationGroup[] = item.item_variation_groups.map((ivg: any) => {
      const group = ivg.variation_groups;
      const mappedVariations: Variation[] = group.group_variations.map((gv: any) => gv.variations);
      return {
        id: group.id,
        name: group.name,
        min_selections: group.min_selections,
        max_selections: group.max_selections,
        empresa_id: group.empresa_id, // Pode precisar ajustar se não vier do JOIN
        created_at: group.created_at, // Pode precisar ajustar
        variations: mappedVariations,
      };
    });

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      category_id: item.category.id,
      category: item.category, // A categoria já vem aninhada
      is_base_price_included: item.is_base_price_included,
      is_available: item.is_available,
      empresa_id: item.empresa_id,
      created_at: item.created_at,
      variation_groups: mappedVariationGroups,
    } as MenuItem;
  });

  return processedMenuItems;
};


/**
 * Função placeholder para obter categorias - precisará de implementação similar
 */
export const getAllCategories = async (empresaId: string): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('display_order', { ascending: true }); // Ordena pelo campo 'order' que agora é string

  if (error) {
    console.error("Erro ao buscar categorias:", error.message);
    throw new Error("Não foi possível carregar as categorias.");
  }

  // Note: Se o display_order for strings como "mIouqarbRei2LMTVPPdU", a ordem alfabética será usada.
  // Se você precisa de uma ordem numérica, considere adicionar um campo 'sort_index' INTEGER.
  return data as Category[];
};

// ... (Outras funções de serviço como saveMenuItem, deleteMenuItem, etc. precisarão ser adaptadas)
