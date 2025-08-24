import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Button } from "../../ui/button";
import { Edit, Trash, PlusCircle, Link, Unlink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { useToast } from "../../../hooks/use-toast"; // Caminho corrigido
import { Variation, VariationGroup } from "../../types/menu";
import { supabase } from '../../lib/supabaseClient';
import {
  MultiSelect,
  MultiSelectItem,
  MultiSelectLabel,
} from "../../ui/multi-select";

interface VariationGroupsTabProps {
  variationGroups: VariationGroup[];
  variations: Variation[];
  loading: boolean;
  onDataChange: () => void;
}

const VariationGroupsTab = ({ variationGroups, variations, loading, onDataChange }: VariationGroupsTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<VariationGroup | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    is_required: false,
    selectedVariations: [] as string[],
  });
  const { toast } = useToast();

  const isFormValid = () => {
    return formState.name && formState.selectedVariations.length > 0;
  };

  const handleCreateOrUpdateGroup = async () => {
    try {
      if (!isFormValid()) {
        toast({
          title: "Erro de Validação",
          description: "Por favor, preencha o nome do grupo e selecione pelo menos uma variação.",
          variant: "destructive",
        });
        return;
      }
      
      const variationIds = formState.selectedVariations;

      if (currentGroup) {
        // Update existing group
        const { error } = await supabase
          .from('variation_groups')
          .update({
            name: formState.name,
            is_required: formState.is_required,
          })
          .eq('id', currentGroup.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: `Grupo de variação "${formState.name}" atualizado.`,
          variant: "default",
        });
      } else {
        // Create new group
        const { data, error } = await supabase
          .from('variation_groups')
          .insert({
            name: formState.name,
            is_required: formState.is_required,
            empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" // Hardcoded for now
          })
          .select()
          .single();
          
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: `Grupo de variação "${formState.name}" criado.`,
          variant: "default",
        });
      }

      setIsDialogOpen(false);
      onDataChange();
    } catch (error) {
      console.error("Erro ao salvar grupo de variação:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o grupo de variação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza de que deseja excluir o grupo de variação "${name}"?`)) {
      try {
        const { error } = await supabase.from('variation_groups').delete().eq('id', id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: `Grupo de variação "${name}" excluído.`,
          variant: "default",
        });
        onDataChange();
      } catch (error) {
        console.error("Erro ao excluir grupo de variação:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao excluir o grupo de variação. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenDialog = (group?: VariationGroup) => {
    setCurrentGroup(group || null);
    if (group) {
      setFormState({
        name: group.name,
        is_required: group.is_required,
        selectedVariations: group.variations?.map(v => v.id) || [],
      });
    } else {
      setFormState({
        name: "",
        is_required: false,
        selectedVariations: [],
      });
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentGroup ? "Editar Grupo de Variação" : "Adicionar Grupo de Variação"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="required" className="text-right">
                  Obrigatório
                </Label>
                <input
                  type="checkbox"
                  id="required"
                  checked={formState.is_required}
                  onChange={(e) => setFormState({ ...formState, is_required: e.target.checked })}
                  className="col-span-3 h-4 w-4"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="variations" className="text-right">
                  Variações
                </Label>
                <MultiSelect
                  className="col-span-3"
                  value={formState.selectedVariations}
                  onChange={(value) => setFormState({ ...formState, selectedVariations: value })}
                >
                  <MultiSelectLabel>Variações</MultiSelectLabel>
                  {variations.map((variation) => (
                    <MultiSelectItem key={variation.id} value={variation.id}>
                      {variation.name}
                    </MultiSelectItem>
                  ))}
                </MultiSelect>
              </div>
            </div>
            <Button onClick={handleCreateOrUpdateGroup}>
              {currentGroup ? "Salvar Alterações" : "Adicionar"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center">Carregando grupos de variação...</div>
      ) : variationGroups.length === 0 ? (
        <div className="text-center">Nenhum grupo de variação encontrado.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Variações</TableHead>
              <TableHead>Obrigatório</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variationGroups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>{group.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {group.variations && group.variations.map((v) => (
                      <span key={v.id} className="bg-gray-200 px-2 py-1 rounded-full text-xs">
                        {v.name}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{group.is_required ? <Link className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(group)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export { VariationGroupsTab };
