import { useNavigate } from "react-router-dom"; // 👈 adicione isso

// dentro do AuthProvider:
const navigate = useNavigate();

const signIn = async (email: string, password: string) => {
  try {
    const result = await authSignIn(email, password);
    const role = result.role;

    toast({
      title: "Login realizado",
      description: "Você entrou com sucesso.",
    });

    // Redireciona com base na role
    switch (role) {
      case "admin":
      case "gerente":
        navigate("/admin-dashboard");
        break;
      case "entregador":
        navigate("/entregador");
        break;
      default:
        navigate("/"); // cliente comum
    }

    return result;
  } catch (error: any) {
    toast({
      title: "Erro ao fazer login",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }
};
