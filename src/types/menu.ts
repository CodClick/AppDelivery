import { Database } from './database.types';

export type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  variation_groups?: VariationGroup[];
};

export type Category = Database['public']['Tables']['categories']['Row'];

export type Variation = Database['public']['Tables']['variations']['Row'];

export type VariationGroup = Database['public']['Tables']['variation_groups']['Row'] & {
  variations?: Variation[];
};
