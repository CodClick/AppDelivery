import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth?.logOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100">
      <header className="bg-[#141414] text-white flex justify-between items-center px-4 py-3 shadow-md">
        <h1 className="text-lg font-bold">AppDelivery</h1>
        {auth?.currentUser && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        )}
      </header>

      <main className="flex-1 p-4">{children}</main>
    </div>
  );
};

export default AppLayout;
