import { Outlet } from "react-router-dom"; // Importe o Outlet
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/contexts/EmpresaContext"; // Adicione a importação do useEmpresa
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import MainNav from '@/components/MainNav';
import UserNav from '@/components/UserNav';
import TeamSwitcher from '@/components/TeamSwitcher';

const AppLayout = () => {
  const { currentUser } = useAuth();
  const { empresa, loading, error } = useEmpresa(); // Use o hook da empresa

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error || !empresa) {
    return <div>Ooops... Empresa não encontrada!</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <TeamSwitcher slug={empresa?.slug} />
          <MainNav className="mx-6 hidden md:block" />
          <div className="ml-auto flex items-center space-x-4">
            {currentUser ? (
              <UserNav />
            ) : (
              <Button asChild>
                <Link to="/login">Entrar</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Outlet /> {/* ESTE É O COMPONENTE CHAVE */}
      </div>
    </div>
  );
};

export default AppLayout;
