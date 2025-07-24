import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminCupons() {
  const [cupons, setCupons] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    tipo: "percentual",
    valor: "",
    validade: "",
  });

  const [empresaId, setEmpresaId] = useState<string | null>(null);

  // 🔐 Buscar o ID da empresa do admin logado
  useEffect(() => {
    const fetchEmpresaId = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) return;

      const { data, error } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        console.error("Erro ao buscar empresa_id:", error);
        return;
      }

      setEmpresaId(data.empresa_id);
    };

    fetchEmpresaId();
  }, []);

  const fetchCupons = async () => {
    const { data, error } = await supabase
      .from("cupons")
      .select("*")
      .eq("empresa_id", empresaId);

    if (error) {
      console.error("Erro ao buscar cupons:", error.message);
    } else {
      setCupons(data || []);
    }
  };

  useEffect(() => {
    if (empresaId) fetchCupons();
  }, [empresaId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const { codigo, tipo, valor, validade } = formData;

    if (!codigo || !valor || !validade || !empresaId) {
      toast.error("Preencha todos os campos!");
      return;
    }

    const valorNumber = parseFloat(valor.replace(",", "."));

    const { error } = await supabase.from("cupons").insert([
      {
        codigo,
        tipo,
        valor: valorNumber,
        validade,
        empresa_id: empresaId,
      },
    ]);

    if (error) {
      console.error("Erro ao criar cupom:", error.message);
      toast.error("Erro ao criar cupom!");
    } else {
      toast.success("Cupom criado com sucesso!");
      setFormData({ codigo: "", tipo: "percentual", valor: "", validade: "" });
      setOpen(false);
      fetchCupons();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cupons de Desconto</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="default">Criar Cupom</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cupom</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo cupom.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Código do Cupom</Label>
                <Input
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  placeholder="EX: BEMVINDO10"
                />
              </div>

              <div>
                <Label>Tipo de Desconto</Label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                >
                  <option value="percentual">Porcentagem (%)</option>
                  <option value="valor_fixo">Valor Fixo (R$)</option>
                </select>
              </div>

              <div>
                <Label>Valor</Label>
                <Input
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  placeholder={formData.tipo === "percentual" ? "Ex: 10 (%)" : "Ex: 5.00 (R$)"}
                />
              </div>

              <div>
                <Label>Validade</Label>
                <Input
                  type="date"
                  name="validade"
                  value={formData.validade}
                  onChange={handleChange}
                />
              </div>

              <Button onClick={handleSubmit} className="w-full">
                Salvar Cupom
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cupons.map((cupom) => (
          <div key={cupom.id} className="p-4 border rounded-lg shadow">
            <h2 className="font-semibold">{cupom.codigo}</h2>
            <p>
              {cupom.tipo === "percentual"
                ? `Desconto: ${cupom.valor}%`
                : `Desconto: R$${cupom.valor.toFixed(2)}`}
            </p>
            <p>Válido até: {new Date(cupom.validade).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
export default AdminCoupons;
