import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthState } from "@/hooks/useAuthState";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminCupons() {
  const [cupons, setCupons] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    tipo: "percentual",
    valor: "",
    validade: "",
  });

  const { user } = useAuthState();
  const { empresa } = useEmpresa(user?.id ?? null);

  useEffect(() => {
    if (empresa?.id) {
      fetchCupons();
    }
  }, [empresa]);

  const fetchCupons = async () => {
    const { data, error } = await supabase
      .from("cupons")
      .select("*")
      .eq("empresa_id", empresa?.id);

    if (error) {
      console.error("Erro ao buscar cupons:", error.message);
    } else {
      setCupons(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      nome: formData.codigo,
      tipo: formData.tipo,
      valor: parseFloat(formData.valor),
      validade: formData.validade,
      empresa_id: empresa?.id,
    };

    let result;
    if (editId) {
      result = await supabase.from("cupons").update(payload).eq("id", editId);
    } else {
      result = await supabase.from("cupons").insert(payload);
    }

    if (result.error) {
      console.error("Erro ao salvar cupom:", result.error.message);
    } else {
      fetchCupons();
      setFormData({ codigo: "", tipo: "percentual", valor: "", validade: "" });
      setEditId(null);
      setOpen(false);
    }
  };

  const handleEdit = (cupom: any) => {
    setFormData({
      codigo: cupom.nome,
      tipo: cupom.tipo,
      valor: cupom.valor.toString(),
      validade: cupom.validade,
    });
    setEditId(cupom.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm("Tem certeza que deseja excluir este cupom?");
    if (!confirm) return;

    const { error } = await supabase.from("cupons").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir cupom:", error.message);
    } else {
      fetchCupons();
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Cupons de Desconto</h1>

      <Button className="mb-4" onClick={() => { setOpen(true); setEditId(null); }}>
        Novo Cupom
      </Button>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <Input
            placeholder="Código do cupom"
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
          />
          <select
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            className="border p-2 rounded w-full"
          >
            <option value="percentual">Percentual (%)</option>
            <option value="fixo">Valor Fixo (R$)</option>
          </select>
          <Input
            type="number"
            placeholder="Valor do desconto"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
          />
          <Input
            type="date"
            value={formData.validade}
            onChange={(e) => setFormData({ ...formData, validade: e.target.value })}
          />
          <div className="flex gap-2">
            <Button type="submit">{editId ? "Salvar Alterações" : "Criar Cupom"}</Button>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <ul className="space-y-3">
        {cupons.map((cupom) => (
          <li
            key={cupom.id}
            className="border p-4 rounded flex items-center justify-between"
          >
            <div>
              <p className="font-semibold">{cupom.nome}</p>
              <p className="text-sm text-gray-600">
                {cupom.tipo === "percentual"
                  ? `${cupom.valor}% de desconto`
                  : `R$ ${cupom.valor.toFixed(2)} de desconto`}{" "}
                - válido até {cupom.validade}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleEdit(cupom)}>
                Editar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(cupom.id)}
              >
                Deletar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
