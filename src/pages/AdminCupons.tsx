import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthState } from "@/hooks/useAuthState";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Cupom {
  id: string;
  codigo: string;
  tipo: "fixo" | "porcentagem";
  valor: number;
  ativo: boolean;
  data_expiracao: string;
}

const AdminCoupons = () => {
  const { user } = useAuthState();
  const { empresa } = useEmpresa(user?.id ?? null);

  const [cupons, setCupons] = useState<Cupom[]>([]);

  // Busca os cupons da empresa logada
  const fetchCupons = async () => {
    if (!empresa?.id) return;

    const { data, error } = await supabase
      .from("cupons")
      .select("*")
      .eq("empresa_id", empresa.id)
      .order("data_expiracao", { ascending: false });

    if (error) {
      console.error("Erro ao buscar cupons:", error);
    } else {
      setCupons(data);
    }
  };

  // Cria um cupom fixo de exemplo
  const handleCreateCoupon = async () => {
    if (!empresa?.id) {
      console.error("Empresa não encontrada.");
      return;
    }

    const { error } = await supabase.from("cupons").insert([
      {
        codigo: "BEMVINDO10",
        tipo: "porcentagem",
        valor: 10,
        ativo: true,
        data_expiracao: "2025-12-31",
        empresa_id: empresa.id,
      },
    ]);

    if (error) {
      console.error("Erro ao criar cupom:", error);
    } else {
      fetchCupons();
    }
  };

  useEffect(() => {
    if (empresa?.id) {
      fetchCupons();
    }
  }, [empresa?.id]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cupons de Desconto</h1>
        <Button onClick={handleCreateCoupon}>Criar Cupom</Button>
      </div>

      {cupons.length === 0 ? (
        <p className="text-muted-foreground">Nenhum cupom cadastrado.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cupons.map((cupom) => (
            <Card key={cupom.id}>
              <CardHeader>
                <CardTitle>{cupom.codigo}</CardTitle>
                <CardDescription>
                  {cupom.tipo === "porcentagem"
                    ? `${cupom.valor}% de desconto`
                    : `R$ ${cupom.valor.toFixed(2)} de desconto`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Expira em: {new Date(cupom.data_expiracao).toLocaleDateString()}</p>
                <p>Status: {cupom.ativo ? "Ativo" : "Inativo"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
