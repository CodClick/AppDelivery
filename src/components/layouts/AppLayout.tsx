import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom"; // Importe o Link

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, logOut } = useAuth();

  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        {currentUser ? (
          // Se houver usuário logado, mostra o botão de sair
          <Button onClick={logOut} variant="outline">
            Sair
          </Button>
        ) : (
          // Se não houver usuário, mostra o botão de entrar
          <Button asChild>
            <Link to="/login">Entrar</Link>
          </Button>
        )}
      </div>
      {children}
    </div>
  );
};

export default AppLayout;
