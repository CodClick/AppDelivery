import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthState } from "@/hooks/useAuthState";
import { useEmpresa } from "@/hooks/useEmpresa";
import { format } from "date-fns";

const supabase = createClient(
  "https://gjwmswafmuyhobwhuwup.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqd21zd2FmbXV5aG9id2h1d3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxOTgwODksImV4cCI6MjA2NTc3NDA4OX0.GGssWKxMhTggo0yGQpVArjulEiI9FSWUNitxqfCQjTw"
);

export default function AdminCupons() {
  const { user } = useAuthState();
  const { empresa } = useEmpresa(user?.id ?? null);

  const [cupons, setCupons] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [novoCupom, setNovoCupom] = useState({
    codigo: "",
    desconto: "",
    validade: "",
  });

  async function carregarCupons() {
    if (!empresa?.id) return;

    const { data, error } = await supabase
      .from("cupons")
      .select("*")
      .eq("empresa_id", empresa.id)
      .order("validade", { ascending: false });

    if (!error) setCupons(data);
  }

  async function criarCupom() {
    if (!empresa?.id) return;

    const { codigo, desconto, validade } = novoCupom;

    const { error } = await supabase.from("cupons").insert([
      {
        codigo,
        desconto: parseFloat(desconto),
        validade,
        empresa_id: empresa.id,
      },
    ]);

    if (!error) {
      setShowModal(false);
      setNovoCupom({ codigo: "", desconto: "", validade: "" });
      carregarCupons();
    } else {
      alert("Erro ao criar cupom");
    }
  }

  useEffect(() => {
    carregarCupons();
  }, [empresa]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand">Cupons de Desconto</h1>
        <Button onClick={() => setShowModal(true)}>Criar Cupom</Button>
      </div>

      <div className="grid gap-4">
        {cupons.map((cupom) => (
          <div
            key={cupom.id}
            className="border p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-lg">{cupom.codigo}</p>
              <p className="text-sm text-gray-500">
                {cupom.desconto}% – válido até{" "}
                {format(new Date(cupom.validade), "dd/MM/yyyy")}
              </p>
            </div>
            <span className="text-sm text-gray-400">
              ID: {cupom.id.slice(0, 8)}...
            </span>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Novo Cupom</h2>
            <Input
              placeholder="Código do cupom"
              value={novoCupom.codigo}
              onChange={(e) =>
                setNovoCupom({ ...novoCupom, codigo: e.target.value })
              }
              className="mb-2"
            />
            <Input
              placeholder="Desconto (%)"
              type="number"
              value={novoCupom.desconto}
              onChange={(e) =>
                setNovoCupom({ ...novoCupom, desconto: e.target.value })
              }
              className="mb-2"
            />
            <Input
              type="date"
              value={novoCupom.validade}
              onChange={(e) =>
                setNovoCupom({ ...novoCupom, validade: e.target.value })
              }
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={criarCupom}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
