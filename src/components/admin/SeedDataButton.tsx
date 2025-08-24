import React, { useState } from 'react';
import { Button } from "../ui/button";
import { useToast } from "../hooks/use-toast";
import { supabase } from '../lib/supabaseClient';
import { Database } from "lucide-react";
import initialData from '../data/initialData';

interface SeedDataButtonProps {
    onDataChange: () => void;
}

const SeedDataButton: React.FC<SeedDataButtonProps> = ({ onDataChange }) => {
    const { toast } = useToast();
    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            const { categories, menuItems, variations, variationGroups } = initialData;

            // Delete all existing data first
            await supabase.from('menu_items').delete().neq('id', 'null');
            await supabase.from('variation_groups').delete().neq('id', 'null');
            await supabase.from('variations').delete().neq('id', 'null');
            await supabase.from('categories').delete().neq('id', 'null');

            // Insert new data
            const { error: categoriesError } = await supabase.from('categories').insert(categories);
            if (categoriesError) throw categoriesError;

            const { error: variationGroupsError } = await supabase.from('variation_groups').insert(variationGroups);
            if (variationGroupsError) throw variationGroupsError;

            const { error: variationsError } = await supabase.from('variations').insert(variations);
            if (variationsError) throw variationsError;

            const { error: menuItemsError } = await supabase.from('menu_items').insert(menuItems);
            if (menuItemsError) throw menuItemsError;

            toast({
                title: "Sucesso!",
                description: "Dados iniciais importados com sucesso.",
            });

            onDataChange();

        } catch (error) {
            console.error("Erro ao importar dados iniciais:", error);
            toast({
                title: "Erro",
                description: "Falha ao importar dados iniciais. Verifique o console para mais detalhes.",
                variant: "destructive",
            });
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <Button onClick={handleSeedData} disabled={isSeeding} className="w-full sm:w-auto text-sm">
            {isSeeding ? 'Importando...' : (
                <>
                    <Database className="mr-2 h-4 w-4" />
                    Importar Dados Iniciais
                </>
            )}
        </Button>
    );
};

export { SeedDataButton };
