import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Edit, Trash, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useToast } from "../../hooks/use-toast"; // Caminho corrigido
import { MenuItem, Category, Variation, VariationGroup } from "../../types/menu";
import { supabase } from '../../lib/supabaseClient';

interface MenuItemsTabProps {
  menuItems: MenuItem[];
  categories: Category[];
  variations: Variation[];
  variationGroups: VariationGroup[];
  loading: boolean;
  onDataChange: () => void;
}

const MenuItemsTab = ({ menuItems, categories, variations, variationGroups, loading, onDataChange }: MenuItemsTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
  });
  const { toast } = useToast();

  const isFormValid = () => {
    return formState.name && formState.description && formState.price && formState.category_id;
  };

  const handleCreateOrUpdateItem = async () => {
    try {
      if (!isFormValid()) {
        toast({
          title: "Erro de Validação",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      if (currentItem) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: formState.name,
            description: formState.description,
            price: parseFloat(formState.price),
            category_id: formState.category_id,
            image_url: formState.image_url,
          })
          .eq('id', currentItem.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: `Item "${formState.name}" atualizado.`,
          variant: "default",
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from('menu_items')
          .insert({
            name: formState.name,
            description: formState.description,
            price: parseFloat(formState.price),
            category_id: formState.category_id,
            image_url: formState.image_url,
            empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" // Hardcoded for now
          });
        
        if (error) throw error;

        toast({
          title: "Sucesso",
          description: `Item "${formState.name}" criado.`,
          variant: "default",
        });
      }

      setIsDialogOpen(false);
      onDataChange();
    } catch (error) {
      console.error("Erro ao salvar item do menu:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o item do menu. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza de que deseja excluir o item "${name}"?`)) {
      try {
        const { error } = await supabase.from('menu_items').delete().eq('id', id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: `Item "${name}" excluído.`,
          variant: "default",
        });
        onDataChange();
      } catch (error) {
        console.error("Erro ao excluir item do menu:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao excluir o item do menu. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenDialog = (item?: MenuItem) => {
    setCurrentItem(item || null);
    if (item) {
      setFormState({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        category_id: item.category_id || "",
        image_url: item.image_url || "",
      });
    } else {
      setFormState({
        name: "",
        description: "",
        price: "",
        category_id: "",
        image_url: "",
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
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentItem ? "Editar Item" : "Adicionar Item"}</DialogTitle>
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
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image_url" className="text-right">
                  URL da Imagem
                </Label>
                <Input
                  id="image_url"
                  value={formState.image_url}
                  onChange={(e) => setFormState({ ...formState, image_url: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <Button onClick={handleCreateOrUpdateItem}>
              {currentItem ? "Salvar Alterações" : "Adicionar"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center">Carregando itens do menu...</div>
      ) : menuItems.length === 0 ? (
        <div className="text-center">Nenhum item do menu encontrado.</div>
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
            {menuItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>R$ {item.price.toFixed(2)}</TableCell>
                <TableCell>
                  {categories.find((cat) => cat.id === item.category_id)?.name || "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id, item.name)}
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

export { MenuItemsTab };
