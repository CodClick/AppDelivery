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
import { Edit, Trash, PlusCircle } from "lucide-react";
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
import { Category } from "../../types/menu";
import { supabase } from '../../lib/supabaseClient';

interface CategoriesTabProps {
  categories: Category[];
  loading: boolean;
  onDataChange: () => void;
}

const CategoriesTab = ({ categories, loading, onDataChange }: CategoriesTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const { toast } = useToast();

  const handleCreateOrUpdateCategory = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro de Validação",
        description: "O nome da categoria não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (currentCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({ name: name.trim() })
          .eq('id', currentCategory.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: `Categoria "${name.trim()}" atualizada.`,
          variant: "default",
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert({ name: name.trim(), empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" }); // Hardcoded for now
        
        if (error) throw error;

        toast({
          title: "Sucesso",
          description: `Categoria "${name.trim()}" criada.`,
          variant: "default",
        });
      }

      setIsDialogOpen(false);
      onDataChange();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a categoria. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza de que deseja excluir a categoria "${name}"?`)) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: `Categoria "${name}" excluída.`,
          variant: "default",
        });
        onDataChange();
      } catch (error) {
        console.error("Erro ao excluir categoria:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao excluir a categoria. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenDialog = (category?: Category) => {
    setCurrentCategory(category || null);
    setName(category?.name || "");
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
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentCategory ? "Editar Categoria" : "Adicionar Categoria"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <Button onClick={handleCreateOrUpdateCategory}>
              {currentCategory ? "Salvar Alterações" : "Adicionar"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="text-center">Carregando categorias...</div>
      ) : categories.length === 0 ? (
        <div className="text-center">Nenhuma categoria encontrada.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id, category.name)}
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

export { CategoriesTab };
