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

export async function signUpAdmin(
  email: string,
  password: string,
  name: string,
  empresaNome: string,
  empresaTelefone: string
): Promise<any> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("Usuário não retornado após o signup");

  const { error: insertUserError } = await supabase.from("usuarios").insert({
    id: user.id,
    nome: name,
    role: "admin",
  });
  if (insertUserError) throw insertUserError;

  const { error: insertEmpresaError } = await supabase.from("empresas").insert({
    nome: empresaNome,
    telefone: empresaTelefone,
    admin_id: user.id,
  });
  if (insertEmpresaError) throw insertEmpresaError;

  return data;
}


export async function signIn(email: string, password: string): Promise<any> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Busca o role do usuário
  const userId = data.user.id;
  const { data: userData, error: userError } = await supabase
    .from("usuarios")
    .select("role")
    .eq("id", userId)
    .single();

  if (userError) throw userError;

  return { ...data, role: userData.role };
}


export async function logOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
