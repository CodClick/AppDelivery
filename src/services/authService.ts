// services/authService.ts
import { supabase } from "@/lib/supabaseClient";

// ---------- SIGN UP CLIENTE ----------
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

  // Se o usuário foi criado e um nome foi fornecido, insere na tabela 'usuarios' com role 'cliente'
  if (user && name) {
    // Usamos upsert aqui para garantir que se por algum motivo o registro já existir (ex: retentativa), ele atualize
    await supabase.from("usuarios").upsert({
      id: user.id,
      nome: name,
      role: "cliente", // padrão para quem se cadastra pelo cardápio
      telefone: phone, // Adicionando o telefone aqui também, se disponível
    });
  }

  return data;
}

// ---------- SIGN IN ----------
export async function signIn(email: string, password: string): Promise<any> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

// ---------- SIGN OUT ----------
export async function logOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ---------- SIGN UP ADMIN ----------
interface AdminSignupData {
  email: string;
  password: string;
  nome: string; // Nome do usuário admin
  empresa_nome: string; // Nome da empresa
  empresa_telefone: string; // Telefone da empresa
}

export async function signUpAdmin({
  email,
  password,
  nome, // Nome do usuário admin
  empresa_nome, // Nome da empresa
  empresa_telefone, // Telefone da empresa
}: AdminSignupData): Promise<any> {
  // --- INÍCIO DA FUNÇÃO signUpAdmin CORRIGIDA ---
  try {
    // 1. Criar usuário no Supabase Auth
    const { data: userData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error("Erro no Supabase Auth SignUp:", authError);
      throw new Error(authError.message || "Falha ao registrar usuário.");
    }

    const user = userData.user;
    if (!user) {
      throw new Error("Usuário não retornado após o signup. Verifique as configurações de autenticação.");
    }

    const userId = user.id;
    let empresaId: string | null = null; // Para armazenar o ID da empresa

    // Gerar o slug a partir do nome da empresa
    const slugGerado = empresa_nome
      .toLowerCase()
      .replace(/\s+/g, '-')       // Substitui espaços por hífens
      .replace(/[^\w-]+/g, '')    // Remove caracteres não alfanuméricos (exceto hífens)
      .replace(/--+/g, '-')      // Substitui múltiplos hífens por um único
      .trim();                    // Remove espaços extras

    // 2. Inserir a nova empresa na tabela 'empresas'
    const { data: empresaData, error: insertEmpresaError } = await supabase
      .from("empresas")
      .insert({
        nome: empresa_nome,
        telefone: empresa_telefone,
        slug: slugGerado, // <-- AGORA O SLUG ESTÁ SENDO INSERIDO!
        admin_id: userId, // Associando o admin_id recém-criado à empresa
      })
      .select("id") // Pede para retornar o ID da empresa recém-criada
      .single(); // Espera um único resultado

    if (insertEmpresaError) {
      console.error("Erro ao inserir empresa:", insertEmpresaError);
      // Opcional: Se a empresa não for criada, você pode tentar deletar o usuário
      // criado no auth.users para evitar registros órfãos. Isso é mais avançado.
      throw new Error(insertEmpresaError.message || "Falha ao criar os dados da empresa.");
    }

    empresaId = empresaData.id; // Pega o ID da empresa recém-criada

    // 3. Inserir o perfil do usuário (admin) na tabela 'usuarios'
    const { error: insertUserError } = await supabase.from("usuarios").insert({
      id: userId, // O ID da tabela usuarios é o user_id do auth.users
      nome: nome, // O nome do administrador
      role: "admin", // Definir a role como 'admin'
      empresa_id: empresaId, // Associar o admin à empresa que ele acabou de criar
      // Outras colunas como 'telefone' para o usuário admin, se houver no seu schema de 'usuarios'
    });

    if (insertUserError) {
      console.error("Erro ao inserir usuário na tabela 'usuarios':", insertUserError);
      throw new Error(insertUserError.message || "Falha ao criar o perfil do administrador.");
    }

    return userData; // Retorna os dados do signup original, que incluem a sessão se o auto-login estiver ativado
  } catch (error: any) {
    console.error("Erro geral no signUpAdmin:", error);
    throw error; // Relança o erro para ser capturado no AdminRegister.tsx
  }
  // --- FIM DA FUNÇÃO signUpAdmin CORRIGIDA ---
}
