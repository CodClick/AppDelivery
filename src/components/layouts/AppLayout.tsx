import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, Outlet } from "react-router-dom"; // Importe o Outlet

const AppLayout = () => {
  const { currentUser, logOut } = useAuth();

  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        {currentUser ? (
          <Button onClick={logOut} variant="outline">
            Sair
          </Button>
        ) : (
          <Button asChild>
            <Link to="/login">Entrar</Link>
          </Button>
        )}
      </div>
      <Outlet /> {/* <-- O COMPONENTE CHAVE ESTÁ AQUI */}
    </div>
  );
};

export default AppLayout;
