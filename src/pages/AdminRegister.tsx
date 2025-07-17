<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Cadastro do Administrador</title>
  <style>
    body {
      background-color: #141414;
      color: #fff;
      font-family: sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    form {
      background: #1f1f1f;
      padding: 2rem;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
      max-width: 400px;
    }
    input {
      padding: 0.75rem;
      border-radius: 4px;
      border: none;
    }
    button {
      background-color: #FA6500;
      border: none;
      padding: 0.75rem;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <form id="adminRegisterForm">
    <h2>Cadastro do Administrador</h2>
    <input type="text" name="nome" placeholder="Nome completo" required />
    <input type="email" name="email" placeholder="Email" required />
    <input type="password" name="senha" placeholder="Senha" required />
    <input type="text" name="nome_empresa" placeholder="Nome do restaurante" required />
    <input type="text" name="token" placeholder="Token de convite" required />
    <button type="submit">Cadastrar</button>
    <div id="msgErro" style="color:red;"></div>
  </form>

  <script type="module">
    import { createClient } from "https://esm.sh/@supabase/supabase-js";

    const supabase = createClient(
      "https://gjwmswafmuyhobwhuwup.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqd21zd2FmbXV5aG9id2h1d3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxOTgwODksImV4cCI6MjA2NTc3NDA4OX0.GGssWKxMhTggo0yGQpVArjulEiI9FSWUNitxqfCQjTw"
    );

    const form = document.getElementById("adminRegisterForm");
    const msgErro = document.getElementById("msgErro");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msgErro.textContent = "";

      const nome = form.nome.value.trim();
      const email = form.email.value.trim();
      const senha = form.senha.value;
      const nome_empresa = form.nome_empresa.value.trim();
      const token = form.token.value.trim();

      // 1. Verificar se token é válido e não usado
      const { data: tokenData, error: tokenError } = await supabase
        .from("admin_tokens")
        .select("*")
        .eq("token", token)
        .eq("usado", false)
        .maybeSingle();

      if (tokenError || !tokenData) {
        msgErro.textContent = "Token inválido ou já utilizado.";
        return;
      }

      const empresa_id = tokenData.empresa_id;

      // 2. Criar usuário no Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: senha
      });

      if (signUpError) {
        msgErro.textContent = "Erro ao criar conta: " + signUpError.message;
        return;
      }

      const user = signUpData.user;

      // 3. Inserir empresa (caso não exista ainda)
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresas")
        .insert({
          id: empresa_id,
          nome: nome_empresa,
          admin_id: user.id
        });

      if (empresaError) {
        msgErro.textContent = "Erro ao criar empresa: " + empresaError.message;
        return;
      }

      // 4. Inserir usuário na tabela `usuarios` com o mesmo ID do auth
      const { error: insertUserError } = await supabase
        .from("usuarios")
        .insert({
          id: user.id, // importante para bater com auth.uid()
          role: "admin",
          nome: nome,
          empresa_id: empresa_id
        });

      if (insertUserError) {
        msgErro.textContent = "Erro ao salvar dados do usuário: " + insertUserError.message;
        return;
      }

      // 5. Marcar o token como usado
      await supabase
        .from("admin_tokens")
        .update({ usado: true })
        .eq("token", token);

      // 6. Redirecionar para o dashboard
      window.location.href = "/admin-dashboard";
    });
  </script>
</body>
</html>
