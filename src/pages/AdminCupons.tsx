import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminCupons() {
  const [cupons, setCupons] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    codigo: "",
    tipo: "percentual",
    valor: "",
    validade: "",
  });

  const empresa_id = localStorage.getItem("empresa_id");

  useEffect(() => {
    if (empresa_id) {
      fetchCupons();
    }
  }, [empresa_id]);

  async function fetchCupons() {
    const { data, error } = await supabase
      .from("cupons")
      .select("*")
      .eq("empresa_id", empresa_id)
      .order("validade", { ascending: false });

    if (error) {
      console.error("Erro ao buscar cupons:", error);
    } else {
      setCupons(data || []);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      nome: formData.codigo,
      tipo: formData.tipo,
      valor: parseFloat(formData.valor),
      validade: formData.validade,
      empresa_id,
    };

    if (editMode && formData.id) {
      const { error } = await supabase
        .from("cupons")
        .update(payload)
        .eq("id", formData.id);

      if (error) {
        console.error("Erro ao atualizar cupom:", error);
        return;
      }
    } else {
      const { error } = await supabase.from("cupons").insert(payload);
      if (error) {
        console.error("Erro ao criar cupom:", error);
        return;
      }
    }

    setFormData({
      id: null,
      codigo: "",
      tipo: "percentual",
      valor: "",
      validade: "",
    });
    setOpen(false);
    setEditMode(false);
    fetchCupons();
  }

  function handleEdit(cupom: any) {
    setFormData({
      id: cupom.id,
      codigo: cupom.nome,
      tipo: cupom.tipo,
      valor: cupom.valor.toString(),
      validade: cupom.validade?.split("T")[0] || "",
    });
    setEditMode(true);
    setOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;

    const { error } = await supabase.from("cupons").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir cupom:", error);
    } else {
      fetchCupons();
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Cupons de Desconto</h2>

      <Button className="mb-4" onClick={() => { setOpen(true); setEditMode(false); }}>
        Criar Cupom
      </Button>

      <table className="w-full text-left border border-zinc-700">
        <thead>
          <tr className="bg-zinc-800 text-white">
            <th className="p-2">Código</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Valor</th>
            <th className="p-2">Validade</th>
            <th className="p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {cupons.map((cupom) => (
            <tr key={cupom.id} className="border-t border-zinc-700 hover:bg-zinc-900">
              <td className="p-2">{cupom.nome}</td>
              <td className="p-2">{cupom.tipo}</td>
              <td className="p-2">
                {cupom.tipo === "percentual"
                  ? `${cupom.valor}%`
                  : `R$ ${cupom.valor.toFixed(2).replace(".", ",")}`}
              </td>
              <td className="p-2">
                {new Date(cupom.validade).toLocaleDateString("pt-BR")}
              </td>
              <td className="p-2 flex gap-2">
                <Button variant="outline" onClick={() => handleEdit(cupom)}>Editar</Button>
                <Button variant="destructive" onClick={() => handleDelete(cupom.id)}>Excluir</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editMode ? "Editar Cupom" : "Novo Cupom"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Código do cupom"
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
              />

              <select
                className="w-full p-2 bg-zinc-800 text-white rounded"
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value })
                }
              >
                <option value="percentual">Percentual (%)</option>
                <option value="valor_fixo">Valor Fixo (R$)</option>
              </select>

              <Input
                type="number"
                placeholder="Valor"
                value={formData.valor}
                onChange={(e) =>
                  setFormData({ ...formData, valor: e.target.value })
                }
              />

              <Input
                type="date"
                value={formData.validade}
                onChange={(e) =>
                  setFormData({ ...formData, validade: e.target.value })
                }
              />

              <div className="flex justify-between mt-4">
                <Button type="submit">{editMode ? "Salvar" : "Criar"}</Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    setEditMode(false);
                    setFormData({
                      id: null,
                      codigo: "",
                      tipo: "percentual",
                      valor: "",
                      validade: "",
                    });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
