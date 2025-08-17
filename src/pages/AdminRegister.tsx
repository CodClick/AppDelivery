import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

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

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Passo 1: Validar o token
    const { data: tokenData, error: tokenError } = await supabase
      .from("admin_tokens")
      .select("*")
      .eq("token", form.token)
      .eq("used", false)
      .single();

    if (tokenError || !tokenData) {
      toast({
        title: "Token inválido",
        description: "O token fornecido é inválido ou já foi utilizado.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Passo 2: Cadastrar o novo usuário admin com email e senha
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            role: "admin",
            name: form.nome,
          },
        },
      });

      if (userError) {
        throw userError;
      }
      
      const newUserId = userData?.user?.id;
      if (!newUserId) {
          throw new Error("ID do usuário não foi retornado após o cadastro.");
      }

      // Passo 3: Criar um registro na tabela 'usuarios' com o ID do usuário e o role
      const { error: profileError } = await supabase
        .from("usuarios")
        .insert({
          id: newUserId,
          role: "admin",
          name: form.nome,
          email: form.email,
        });

      if (profileError) {
        throw profileError;
      }

      // Passo 4: Cadastrar a empresa, associando o admin_id com o newUserId
      const { error: empresaError } = await supabase
        .from("empresas")
        .insert({
          nome: form.empresa_nome,
          admin_id: newUserId, // AQUI está a correção!
          telefone: form.empresa_telefone,
        });

      if (empresaError) {
        // Se a inserção da empresa falhar, é crucial tentar remover o usuário recém-criado
        // para evitar que ele fique 'órfão' e possa ser usado.
        // **IMPORTANTE**: A deleção de usuários só pode ser feita com a role `service_role`.
        // A sua API do Supabase deve estar configurada para isso.
        // Por exemplo: await supabase.auth.admin.deleteUser(newUserId);
        // Ou, para o fluxo do usuário logado, você pode simplesmente deslogá-lo
        await supabase.auth.signOut(); 
        throw empresaError;
      }

      // Passo 5: Marcar o token como usado somente após todas as inserções
      const { error: updateTokenError } = await supabase
        .from("admin_tokens")
        .update({ used: true })
        .eq("id", tokenData.id);

      if (updateTokenError) {
        throw updateTokenError;
      }

      // Se tudo ocorrer bem, redireciona para o painel de administração
      toast({
        title: "Sucesso!",
        description: "Restaurante cadastrado com sucesso.",
        variant: "default",
      });
      navigate("/admin-dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
      console.error("Erro no fluxo de cadastro:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-brand">
          Cadastro do Restaurante
        </h2>
        {/* ... (o resto do formulário é o mesmo) ... */}
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="nome">Seu nome</Label>
          <Input
            name="nome"
            type="text"
            value={form.nome}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="empresa_nome">Nome da empresa</Label>
          <Input
            name="empresa_nome"
            type="text"
            value={form.empresa_nome}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="empresa_telefone">Telefone da empresa</Label>
          <Input
            name="empresa_telefone"
            type="text"
            value={form.empresa_telefone}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="token">Token de Acesso</Label>
          <Input
            name="token"
            type="text"
            value={form.token}
            onChange={handleChange}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Cadastrando..." : "Criar conta"}
        </Button>
      </form>
    </div>
  );
}
