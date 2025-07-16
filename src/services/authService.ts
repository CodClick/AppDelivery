// services/authService.ts
import { supabase } from "@/lib/supabaseClient";

export async function signUp(
  email: string,
  password: string,
  name?: string,
  phone?: string
): Promise<any> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  const user = data.user;

  if (user && name) {
    await supabase.from("usuarios").upsert({
      id: user.id,
      nome: name,
      role: "cliente", // padrão para quem faz signup via cardápio
    });
  }

  return data;
}

// services/authService.ts
import { supabase } from "@/lib/supabaseClient";

interface AdminSignupData {
  email: string;
  password: string;
  nome: string;
  empresa_nome: string;
  empresa_telefone: string;
}

export async function signUpAdmin({
  email,
  password,
  nome,
  empresa_nome,
  empresa_telefone,
}: AdminSignupData): Promise<any> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("Usuário não retornado após o signup");

  const { error: insertUserError } = await supabase.from("usuarios").insert({
    id: user.id,
    nome,
    role: "admin",
  });
  if (insertUserError) throw insertUserError;

  const { error: insertEmpresaError } = await supabase.from("empresas").insert({
    nome: empresa_nome,
    telefone: empresa_telefone,
    admin_id: user.id,
  });
  if (insertEmpresaError) throw insertEmpresaError;

  return data;
}
