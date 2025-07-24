import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useAuthState } from "@/hooks/useAuthState";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/lib/supabaseClient";

type Cupom = {
  id: string;
  nome: string;
  tipo: "percentual" | "valor_fixo";
  valor: number;
  validade: string;
};

export default function AdminCupons() {
  const { user } = useAuthState();
  const { empresa } = useEmpresa(user?.id ?? null);

  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    tipo: "percentual",
    valor: "",
    validade: "",
  });

  useEffect(() => {
    if (empresa?.id) {
      fetchCupons();
    }
  }, [empresa?.id]);

  async function fetchCupons() {
    const { data, error } = await supabase
      .from("cupons")
      .select("*")
      .eq("empresa_id", empresa?.id);

    if (!error && data) {
      setCupons(data);
    }
  }

async function criarCupom() {
  try {
    if (!form.nome || !form.valor || !form.validade || !empresa?.id) {
      console.warn("Campos obrigatórios não preenchidos.");
      return;
    }

    const newCupom = {
      nome: form.nome,
      tipo: form.tipo,
      valor: parseFloat(form.valor),
      validade: form.validade,
      empresa_id: empresa.id,
    };

    const { data, error } = await supabase.from("cupons").insert(newCupom);

    if (error) {
      console.error("Erro ao inserir cupom:", error.message, error.details);
    } else {
      console.log("Cupom criado com sucesso:", data);
      setForm({ nome: "", tipo: "percentual", valor: "", validade: "" });
      setOpen(false);
      fetchCupons();
    }
  } catch (err) {
    console.error("Erro inesperado ao criar cupom:", err);
  }
}


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand">Cupons de Desconto</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand hover:bg-brand-600 text-white">Criar Cupom</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cupom</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do cupom</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: BEMVINDO10"
                />
              </div>
              <div>
                <Label>Tipo de desconto</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(value) => setForm({ ...form, tipo: value as "percentual" | "valor_fixo" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentual">Porcentagem (%)</SelectItem>
                    <SelectItem value="valor_fixo">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  placeholder="Ex: 10"
                />
              </div>
              <div>
                <Label>Validade</Label>
                <Input
                  type="date"
                  value={form.validade}
                  onChange={(e) => setForm({ ...form, validade: e.target.value })}
                />
              </div>
              <Button className="w-full bg-brand" onClick={criarCupom}>
                Salvar Cupom
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {cupons.length === 0 ? (
        <p className="text-gray-500">Nenhum cupom criado ainda.</p>
      ) : (
        <div className="grid gap-4">
          {cupons.map((cupom) => (
            <div
              key={cupom.id}
              className="p-4 border border-gray-300 rounded-lg shadow-sm bg-white"
            >
              <h3 className="font-semibold text-lg">{cupom.nome}</h3>
              <p className="text-sm">
                {cupom.tipo === "percentual" ? `${cupom.valor}%` : `R$ ${cupom.valor.toFixed(2)}`} de desconto
              </p>
              <p className="text-xs text-gray-500">
                Válido até: {new Date(cupom.validade).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
                  }
