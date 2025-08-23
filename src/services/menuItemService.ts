import { supabase } from "@/lib/supabaseClient";
import { MenuItem, Variation, VariationGroup } from "@/types/menu";

/**
 * Obtém todos os itens do menu para uma empresa específica.
 * Inclui dados relacionados de categoria e grupos de variação/variações.
 * @param empresaId O UUID da empresa para filtrar os dados.
 */
export const getAllMenuItems = async (empresaId: string): Promise<MenuItem[]> => {
  console.log("Buscando todos os itens do menu para o empresaId:", empresaId);

  if (!empresaId) {
    console.error("empresaId não fornecido. Abortando a busca de itens do menu.");
    return [];
  }

  const { data: menuItemsData, error } = await supabase
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
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Erro ao buscar itens do menu:", error.message);
    throw new Error("Não foi possível carregar os itens do menu.");
  }

  const mappedItems: MenuItem[] = menuItemsData.map((item: any) => {
    const variationGroups: VariationGroup[] = (item.item_variation_groups || [])
      .map((ivg: any) => {
        const group = ivg.variation_group;
        if (!group) return null;

        const variations: Variation[] = (group.group_variations || [])
          .map((gv: any) => gv.variation)
          .filter(v => v);

        return {
          id: group.id,
          name: group.name,
          minRequired: group.min_selections,
          maxAllowed: group.max_selections,
          variations: variations.map((v: any) => v.id),
          customMessage: "",
          variationsData: variations.map((v: any) => ({
            id: v.id,
            name: v.name,
            price_adjustment: v.price_adjustment,
            available: v.is_available,
            categoryIds: [],
          })),
        };
      })
      .filter(group => group);

    const categoryId = item.category?.id;

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image_url || "",
      category: categoryId,
      popular: item.is_popular,
      hasVariations: (item.item_variation_groups || []).length > 0,
      variationGroups: variationGroups,
    };
  });

  return mappedItems;
};

/**
 * Salva (insere ou atualiza) um item do menu no Supabase.
 * @param item O objeto MenuItem a ser salvo.
 * @param empresaId O UUID da empresa à qual o item pertence.
 * @returns O item do menu salvo com os dados atualizados do banco.
 */
export const saveMenuItem = async (item: MenuItem, empresaId: string): Promise<MenuItem> => {
    // Objeto que será inserido/atualizado no banco de dados.
    const itemToSave = {
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image,
      category_id: item.category,
      is_popular: item.popular,
      is_available: true,
      is_base_price_included: !item.hasVariations,
      empresa_id: empresaId,
    };

    let data;
    let error;

    if (item.id) {
      // Se o item já tem um ID, fazemos um UPDATE
      const result = await supabase
        .from('menu_items')
        .update(itemToSave)
        .eq('id', item.id)
        .eq('empresa_id', empresaId)
        .select();
      data = result.data;
      error = result.error;
    } else {
      // Se não tem ID, é um novo item, fazemos um INSERT
      const result = await supabase
        .from('menu_items')
        .insert(itemToSave)
        .select();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Erro ao salvar o item do menu:", error);
      throw new Error("Não foi possível salvar o item do menu. Por favor, tente novamente.");
    }

    const savedItem = data ? data[0] : null;

    if (!savedItem) {
      throw new Error("O item foi salvo, mas não foi retornado corretamente.");
    }

    const mappedItem: MenuItem = {
      ...item,
      id: savedItem.id,
    };

    return mappedItem;
};

/**
 * Deleta um item do menu e suas associações com grupos de variação.
 * @param menuItemId O ID do item do menu a ser deletado.
 */
export const deleteMenuItem = async (menuItemId: string) => {
    console.log("DEBUG: Tentando deletar item do menu com ID:", menuItemId);
    try {
        // Deleta as associações do item com os grupos de variação
        const { error: ivgError } = await supabase
            .from('item_variation_groups')
            .delete()
            .eq('menu_item_id', menuItemId);

        if (ivgError) {
            console.error("DEBUG: Erro ao deletar associações de grupos de variação:", ivgError);
            throw ivgError;
        }
        console.log("DEBUG: Associações de grupos de variação deletadas com sucesso.");

        // Deleta o item do menu
        const { error: itemError } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', menuItemId);

        if (itemError) {
            console.error("DEBUG: Erro ao deletar o item do menu:", itemError);
            throw itemError;
        }
        console.log("DEBUG: Item do menu deletado com sucesso.");

    } catch (error) {
        console.error("DEBUG: Erro na função deleteMenuItem:", error);
        throw error;
    }
};

/**
 * Limpa os itens 'populares', marcando-os como não-populares se forem muitos.
 */
export const cleanupPopularItems = async () => {
    console.log("DEBUG: Executando cleanupPopularItems...");
    try {
        const { data: popularItems, error: popularItemsError } = await supabase
            .from('menu_items')
            .select('id, created_at')
            .eq('is_popular', true)
            .order('created_at', { ascending: false });

        if (popularItemsError) {
            throw popularItemsError;
        }

        if (popularItems.length > 5) {
            const itemsToUpdate = popularItems.slice(5);
            console.log("DEBUG: Mais de 5 itens populares encontrados. Desmarcando os mais antigos...");
            const itemIdsToUpdate = itemsToUpdate.map(item => item.id);

            const { error: updateError } = await supabase
                .from('menu_items')
                .update({ is_popular: false })
                .in('id', itemIdsToUpdate);

            if (updateError) {
                console.error("DEBUG: Erro ao atualizar itens populares:", updateError);
                throw updateError;
            }
            console.log("DEBUG: Itens populares atualizados com sucesso.");
        } else {
            console.log("DEBUG: Número de itens populares dentro do limite. Nenhuma ação necessária.");
        }
    } catch (error) {
        console.error("DEBUG: Erro em cleanupPopularItems:", error);
        throw error;
    }
};
