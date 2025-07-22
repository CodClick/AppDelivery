import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuthState } from "@/hooks/useAuthState";
import { useEmpresa } from "@/hooks/useEmpresa";

const AdminCoupons = () => {
  const { user } = useAuthState();
  const { empresa } = useEmpresa(user?.id ?? null);

  const [cupons, setCupons] = useState([]);
  const [novoCupom, setNovoCupom] = useState({
    codigo: "",
    tipo: "percentual",
    valor: "",
    data_expiracao: "",
  });

  const fetchCupons = async () => {
    if (!empresa) return;
    const { data, error } = await supabase
      .from("cupons")
      .select("*")
      .eq("empresa_id", empresa.id)
      .order("criado_em", { ascending: false });

    if (!error) setCupons(data);
  };

  useEffect(() => {
    fetchCupons();
  }, [empresa]);

  const handleCriarCupom = async () => {
    const { error } = await supabase.from("cupons").insert({
      empresa_id: empresa.id,
      ...novoCupom,
      valor: parseFloat(novoCupom.valor),
    });
    if (!error) {
      setNovoCupom({
        codigo: "",
        tipo: "percentual",
        valor: "",
        data_expiracao: "",
      });
      fetchCupons();
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Cupons de Desconto</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Criar Novo Cupom</CardTitle>
          <CardDescription>Adicione um novo código de desconto</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={novoCupom.codigo}
              onChange={(e) =>
                setNovoCupom({ ...novoCupom, codigo: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div>
            <Label htmlFor="valor">Valor</Label>
            <Input
              id="valor"
              type="number"
              value={novoCupom.valor}
              onChange={(e) =>
                setNovoCupom({ ...novoCupom, valor: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              className="w-full border rounded px-3 py-2"
              value={novoCupom.tipo}
              onChange={(e) =>
                setNovoCupom({ ...novoCupom, tipo: e.target.value })
              }
            >
              <option value="percentual">Percentual (%)</option>
              <option value="fixo">Valor Fixo (R$)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="data_expiracao">Validade</Label>
            <Input
              id="data_expiracao"
              type="date"
              value={novoCupom.data_expiracao}
              onChange={(e) =>
                setNovoCupom({ ...novoCupom, data_expiracao: e.target.value })
              }
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleCriarCupom}>Criar Cupom</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cupons Atuais</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {cupons.map((cupom) => (
              <li key={cupom.id} className="border-b pb-2">
                <div className="flex justify-between">
                  <div>
                    <strong>{cupom.codigo}</strong> —{" "}
                    {cupom.tipo === "percentual"
                      ? `${cupom.valor}%`
                      : `R$ ${cupom.valor.toFixed(2)}`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {cupom.data_expiracao
                      ? `Válido até ${new Date(
                          cupom.data_expiracao
                        ).toLocaleDateString()}`
                      : "Sem validade"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCoupons;
