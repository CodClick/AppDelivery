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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useToast } from "../../../hooks/use-toast"; // Caminho corrigido
import { Variation, Category } from "../../types/menu";
import { supabase } from '../../lib/supabaseClient';

interface VariationsTabProps {
  variations: Variation[];
  categories: Category[];
  loading: boolean;
  onDataChange: () => void;
}

const VariationsTab = ({ variations, categories, loading, onDataChange }: VariationsTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentVariation, setCurrentVariation] = useState<Variation | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    price: "",
    category_id: "",
  });
  const { toast } = useToast();

  const isFormValid = () => {
    return formState.name && formState.price && formState.category_id;
  };

  const handleCreateOrUpdateVariation = async () => {
    try {
      if (!isFormValid()) {
        toast({
          title: "Erro de Validação",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      if (currentVariation) {
        // Update existing variation
        const { error } = await supabase
          .from('variations')
          .update({
            name: formState.name,
            price: parseFloat(formState.price),
            category_id: formState.category_id,
          })
          .eq('id', currentVariation.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: `Variação "${formState.name}" atualizada.`,
          variant: "default",
        });
      } else {
        // Create new variation
        const { error } = await supabase
          .from('variations')
          .insert({
            name: formState.name,
            price: parseFloat(formState.price),
            category_id: formState.category_id,
            empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" // Hardcoded for now
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: `Variação "${formState.name}" criada.`,
          variant: "default",
        });
      }

      setIsDialogOpen(false);
      onDataChange();
    } catch (error) {
      console.error("Erro ao salvar variação:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a variação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVariation = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza de que deseja excluir a variação "${name}"?`)) {
      try {
        const { error } = await supabase.from('variations').delete().eq('id', id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: `Variação "${name}" excluída.`,
          variant: "default",
        });
        onDataChange();
      } catch (error) {
        console.error("Erro ao excluir variação:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao excluir a variação. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenDialog = (variation?: Variation) => {
    setCurrentVariation(variation || null);
    if (variation) {
      setFormState({
        name: variation.name,
        price: variation.price.toString(),
        category_id: variation.category_id || "",
      });
    } else {
      setFormState({
        name: "",
        price: "",
        category_id: "",
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
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Variação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentVariation ? "Editar Variação" : "Adicionar Variação"}</DialogTitle>
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
                <Label htmlFor="price" className="text-right">
                  Preço
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formState.price}
                  onChange={(e) => setFormState({ ...formState, price: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Categoria
                </Label>
                <Select
                  value={formState.category_id}
                  onValueChange={(value) => setFormState({ ...formState, category_id: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateOrUpdateVariation}>
              {currentVariation ? "Salvar Alterações" : "Adicionar"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center">Carregando variações...</div>
      ) : variations.length === 0 ? (
        <div className="text-center">Nenhuma variação encontrada.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variations.map((variation) => (
              <TableRow key={variation.id}>
                <TableCell>{variation.name}</TableCell>
                <TableCell>R$ {variation.price.toFixed(2)}</TableCell>
                <TableCell>
                  {categories.find((cat) => cat.id === variation.category_id)?.name || "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(variation)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteVariation(variation.id, variation.name)}
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

export { VariationsTab };
