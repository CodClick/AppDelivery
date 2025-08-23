// src/services/menuService.ts
import { supabase } from '@/lib/supabaseClient';
import { MenuItem, Category } from '@/types/menu';

/**
 * Busca todas as categorias de uma empresa a partir do slug.
 * @param {string} slug O slug da empresa.
 * @returns {Promise<Category[]>} Uma promessa que resolve para um array de categorias.
 */
export async function getAllCategories(slug) {
  try {
    // 1. Encontrar o ID da empresa a partir do slug
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

    // 2. Buscar categorias baseadas no ID da empresa
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
    
    // Adiciona a categoria 'Todos' no início
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
export async function getAllMenuItems(slug) {
  try {
    // 1. Encontrar o ID da empresa a partir do slug
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

    // 2. Buscar itens de menu baseados no ID da empresa e join com categorias
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

    // Adaptar a estrutura para o seu tipo MenuItem
    const formattedItems = data.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      category: item.category?.id // Assume que a categoria vem como um objeto e pegamos o ID
    }));

    return formattedItems;

  } catch (err) {
    console.error('Erro inesperado em getAllMenuItems:', err);
    return [];
  }
}
