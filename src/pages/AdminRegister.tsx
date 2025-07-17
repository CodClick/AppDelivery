import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signUpAdmin } from "@/services/authService";

export default function AdminRegister() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    nome: "",
    empresa_nome: "",
    empresa_telefone: "",
	token: "",
  });

const token = document.getElementById('adminToken').value;

const { data, error } = await supabase
  .from('admin_tokens')
  .select('*')
  .eq('token', token)
  .eq('used', false)
  .single();

if (error || !data) {
  alert('Token inválido ou já utilizado.');
  return;
}

// prosseguir com o cadastro...


  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!form.empresa_telefone.trim()) {
      toast({
        title: "Telefone obrigatório",
        description: "Informe o telefone da empresa.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      await signUpAdmin(form);
      navigate("/admin-dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center text-brand">Cadastro do Restaurante</h2>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <Input name="password" type="password" value={form.password} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="nome">Seu nome</Label>
          <Input name="nome" type="text" value={form.nome} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="empresa_nome">Nome da empresa</Label>
          <Input name="empresa_nome" type="text" value={form.empresa_nome} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="empresa_telefone">Telefone da empresa</Label>
          <Input name="empresa_telefone" type="text" value={form.empresa_telefone} onChange={handleChange} required />
        </div>
		<div className="mb-4">
  <label htmlFor="access_token" className="block text-sm font-medium text-white">
    Token de Acesso
  </label>
  <input
    type="text"
    id="access_token"
    name="access_token"
    value={form.access_token}
    onChange={handleChange}
    required
    className="mt-1 p-2 block w-full rounded-md bg-zinc-800 text-white border border-zinc-700"
    placeholder="Insira seu token de acesso"
  />
</div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Cadastrando..." : "Criar conta"}
        </Button>
      </form>
    </div>
  );
}
