import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AdminRegister() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    nomeEmpresa: "",
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Cria conta no Supabase
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha,
    });

    if (signUpError || !signUpData.user) {
      console.error("Erro ao criar conta:", signUpError?.message);
      return;
    }

    const session = signUpData.session;

    // Cria empresa
    const { data: empresaData, error: empresaError } = await supabase
      .from("empresas")
      .insert({ nome: form.nomeEmpresa })
      .select()
      .single();

    if (empresaError || !empresaData) {
      console.error("Erro ao criar empresa:", empresaError?.message);
      return;
    }

    const empresa_id = empresaData.id;

    // Cria usuário admin vinculado à empresa
    const { error: insertUserError } = await supabase.from("usuarios").insert({
      id: signUpData.user.id, // ID do usuário criado
      user_id: signUpData.user.id,
      role: "admin",
      nome: form.nome,
      empresa_id: empresa_id,
    });

    if (insertUserError) {
      console.error("Erro ao registrar usuário:", insertUserError.message);
      return;
    }

    // Redireciona para o dashboard
    navigate("/admin-dashboard");
  };

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-[#b40000]">
          Cadastro do Administrador
        </h2>

        <input
          type="text"
          name="nome"
          placeholder="Seu nome"
          value={form.nome}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Seu e-mail"
          value={form.email}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          required
        />
        <input
          type="password"
          name="senha"
          placeholder="Crie uma senha"
          value={form.senha}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          required
        />
        <input
          type="text"
          name="nomeEmpresa"
          placeholder="Nome da empresa"
          value={form.nomeEmpresa}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          required
        />

        <button
          type="submit"
          className="w-full p-3 bg-[#f65000] text-white font-semibold rounded-lg hover:bg-[#ff7b2c]"
        >
          Registrar
        </button>
      </form>
    </div>
  );
}
