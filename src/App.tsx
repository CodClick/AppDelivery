import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LucideShoppingCart } from "lucide-react";
import { User, Session, createClient } from "@supabase/supabase-js";

// Definição dos tipos para evitar erros de compilação
interface AuthContextType {
  user: User | null;
  session: Session | null;
  empresaId: string | null;
  loading: boolean;
  signIn: any;
  signOut: any;
  signUp: any;
}

interface CartContextType {
  cart: any[];
  itemCount: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addItem: (item: any) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

// Configuração do Supabase (substitua com suas chaves reais, se necessário)
const supabaseUrl = "https://your-project-id.supabase.co";
const supabaseAnonKey = "your-anon-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const queryClient = new QueryClient();

// UI Components (simulando shadcn/ui)
const Toaster = () => <div className="fixed bottom-4 right-4">Toaster</div>;
const Sonner = () => <div className="fixed bottom-4 left-4">Sonner</div>;
const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const Skeleton = ({ className }: { className: string }) => <div className={`bg-gray-300 rounded-lg ${className}`}></div>;
const Button = ({ className, onClick, children }: { className: string, onClick?: () => void, children: React.ReactNode }) => <button className={`p-4 rounded-md ${className}`} onClick={onClick}>{children}</button>;
const Badge = ({ variant, className, children }: { variant: string, className: string, children: React.ReactNode }) => <span className={`px-2 py-1 text-xs font-bold rounded-full ${className}`}>{children}</span>;

// Layout Component
const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-100 font-sans antialiased">
    <div className="pt-16 pb-20">
      {children}
    </div>
  </div>
);

// Contexts
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CartContext = createContext<CartContextType | undefined>(undefined);

// Auth Provider
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          const { data, error } = await supabase
            .from("usuarios")
            .select("empresa_id")
            .eq("id", currentUser.id)
            .single();

          if (error) {
            console.error("Erro ao buscar empresaId:", error);
            setEmpresaId(null);
          } else if (data) {
            setEmpresaId(data.empresa_id);
          }
        } else {
          setEmpresaId(null);
        }

        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    empresaId,
    loading,
    signIn: supabase.auth.signInWithPassword,
    signOut: supabase.auth.signOut,
    signUp: supabase.auth.signUp,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Cart Provider
const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addItem = (item: any) => setCart((prev) => [...prev, item]);
  const removeItem = (itemId: string) => setCart((prev) => prev.filter((i) => i.id !== itemId));
  const clearCart = () => setCart([]);
  const itemCount = cart.length;
  const totalPrice = cart.reduce((total, item) => total + item.price, 0);

  const value = {
    cart,
    itemCount,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
    addItem,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Hooks
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
};

// Pages
const Index = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { slug } = useParams();
  const { itemCount, setIsCartOpen } = useCart();
  const [empresaData, setEmpresaData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        const { data: empresa, error: empresaError } = await supabase
          .from('empresas')
          .select('id, nome, logo_url, cor_primaria, cor_secundaria')
          .eq('slug', slug)
          .single();

        if (empresaError || !empresa) {
          console.error('Empresa não encontrada:', empresaError?.message || 'Empresa com slug não encontrada.');
          setIsLoading(false);
          return;
        }
        setEmpresaData(empresa);
        const empresaId = empresa.id;

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name, display_order')
          .eq('empresa_id', empresaId)
          .order('display_order', { ascending: true });

        if (categoriesError) throw new Error(categoriesError.message);
        
        const formattedCategories = categoriesData.map(cat => ({
          id: cat.id,
          name: cat.name,
          order: cat.display_order
        }));
        const categoriesWithAll = [{ id: "all", name: "Todos", order: 0 }, ...formattedCategories];
        setCategories(categoriesWithAll);

        const { data: menuItemsData, error: itemsError } = await supabase
          .from('menu_items')
          .select(`
            id,
            name,
            description,
            price,
            image_url,
            category_id
          `)
          .eq('empresa_id', empresaId);

        if (itemsError) throw new Error(itemsError.message);

        const formattedItems = menuItemsData.map(item => ({
          ...item,
          category: item.category_id
        }));
        setMenuItems(formattedItems as any);

      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slug]);

  const filteredItems = activeCategory === "all"
    ? menuItems
    : menuItems.filter((item: any) => item.category === activeCategory);

  const groupedItems = categories.reduce((acc: any[], category: any) => {
    if (category.id === "all") return acc;
    
    const categoryItems = filteredItems.filter((item: any) => item.category === category.id);
    if (categoryItems.length > 0) {
      acc.push({
        category,
        items: categoryItems
      });
    }
    return acc;
  }, []);

  const RestaurantHeader = ({ nome, logo_url, cor_primaria, cor_secundaria }: any) => (
    <div className="relative">
      <div className="h-48 sm:h-64 w-full bg-cover bg-center" style={{ backgroundImage: `url(${logo_url})`, backgroundColor: cor_primaria }}></div>
      <div className="container mx-auto px-4 relative -mt-16 sm:-mt-24 z-10 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col sm:flex-row items-center">
          <div className="w-24 h-24 rounded-full bg-gray-400 mr-0 sm:mr-6 mb-4 sm:mb-0" style={{ backgroundColor: cor_secundaria }}></div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-800">{nome}</h1>
          </div>
        </div>
      </div>
    </div>
  );

  const CategoryNav = ({ categories, activeCategory, onSelectCategory }: any) => (
    <div className="sticky top-0 bg-white z-20 shadow-sm overflow-x-auto whitespace-nowrap px-4 py-2">
      <nav className="flex space-x-4">
        {categories.map((category: any) => (
          <Button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-medium ${activeCategory === category.id ? "bg-black text-white" : "bg-gray-200 text-gray-800"}`}
          >
            {category.name}
          </Button>
        ))}
      </nav>
    </div>
  );
  
  const MenuSection = ({ title, items }: any) => (
    <section id={title.toLowerCase().replace(/ /g, "-")} className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item: any) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden flex">
            <div className="flex-1 p-4">
              <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              <div className="mt-2 text-xl font-bold text-gray-800">R$ {item.price.toFixed(2)}</div>
            </div>
            {item.image_url && (
              <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </section>
  );

  if (isLoading) {
    return (
      <div>
        <div className="relative animate-pulse">
          <div className="h-48 sm:h-64 w-full bg-gray-300"></div>
          <div className="container mx-auto px-4 relative -mt-16 sm:-mt-24 z-10 mb-6">
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col sm:flex-row items-center">
              <div className="w-24 h-24 rounded-full bg-gray-400 mr-0 sm:mr-6 mb-4 sm:mb-0"></div>
              <div className="text-center sm:text-left">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!empresaData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
        <h1 className="text-2xl font-bold text-gray-800">Oops! Empresa não encontrada.</h1>
        <p className="mt-2 text-gray-600">Verifique se o endereço está correto ou tente novamente mais tarde.</p>
      </div>
    );
  }
  
  return (
    <div>
      <RestaurantHeader {...(empresaData as any)} />
      
      <CategoryNav
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />
      
      <div className="container mx-auto px-4 py-8">
        {activeCategory === "all" ? (
          groupedItems.map(({ category, items }: any) => (
            <MenuSection
              key={category.id}
              title={category.name}
              items={items}
            />
          ))
        ) : (
          <MenuSection
            title={categories.find((cat: any) => cat.id === activeCategory)?.name || "Menu"}
            items={filteredItems}
          />
        )}
      </div>

      {itemCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
          <Button
            className="w-full max-w-sm rounded-full text-lg h-14 shadow-lg bg-black text-white"
            onClick={() => setIsCartOpen(true)}
          >
            <LucideShoppingCart className="mr-2" />
            Ver Carrinho <Badge variant="secondary" className="ml-2 bg-white text-black font-bold">({itemCount})</Badge>
          </Button>
        </div>
      )}
    </div>
  );
};

// Placeholder Pages
const Login = () => <div>Login Page</div>;
const Register = () => <div>Register Page</div>;
const Admin = () => <div>Admin Page</div>;
const AdminDashboard = () => <div>Admin Dashboard Page</div>;
const Orders = () => <div>Orders Page</div>;
const AdminOrders = () => <div>Admin Orders Page</div>;
const Entregador = () => <div>Entregador Page</div>;
const PDV = () => <div>PDV Page</div>;
const Api = () => <div>Api Page</div>;
const NotFound = () => <div>404 Not Found</div>;
const ShoppingCart = () => <div>Shopping Cart Component</div>;
const Checkout = () => <div>Checkout Page</div>;
const AdminRegister = () => <div>Admin Register Page</div>;
const AdminCupons = () => <div>Admin Coupons Page</div>;
const ForgotPassword = () => <div>Forgot Password Page</div>;
const ResetPassword = () => <div>Reset Password Page</div>;

// Componente PrivateRoute adaptado para usar o user do useAuth
const PrivateRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    console.log("PrivateRoute: Usuário não autenticado, redirecionando para /login");
    return <Navigate to="/login" />;
  }

  const userRole = user?.user_metadata?.role;

  if (userRole === "admin") {
    console.log(`PrivateRoute: Usuário é admin. Acesso permitido a todas as páginas.`);
    return <>{children}</>;
  }
  
  if (role && userRole !== role) {
    console.log(`PrivateRoute: Acesso negado. userRole '${userRole}' != role esperado '${role}'. Redirecionando para /unauthorized`);
    return <Navigate to="/unauthorized" />;
  }

  console.log(`PrivateRoute: Acesso permitido para role '${userRole}' na rota com role '${role || "qualquer logado"}'`);
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin-register" element={<AdminRegister />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<NotFound />} />

              {/* Rota inicial que usa AppLayout */}
              <Route
                path="/"
                element={
                  <AppLayout>
                    <Index />
                  </AppLayout>
                }
              />

              {/* Rotas de Admin e outras rotas privadas com verificação de role */}
              <Route
                path="/admin-coupons"
                element={
                  <PrivateRoute role="admin">
                    <AppLayout>
                      <AdminCupons />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <PrivateRoute role="admin">
                    <AppLayout>
                      <AdminDashboard />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute role="admin">
                    <AppLayout>
                      <Admin />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Orders />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin-orders"
                element={
                  <PrivateRoute role="admin">
                    <AppLayout>
                      <AdminOrders />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/entregador"
                element={
                  <PrivateRoute role="entregador">
                    <AppLayout>
                      <Entregador />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/pdv"
                element={
                  <PrivateRoute role="admin">
                    <AppLayout>
                      <PDV />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/api/*"
                element={
                  <PrivateRoute role="admin">
                    <AppLayout>
                      <Api />
                    </AppLayout>
                  </PrivateRoute>
                }
              />

              {/* Rota de Cliente para slug específico */}
              <Route
                path="/:slug"
                element={
                  <AppLayout>
                    <Index />
                  </AppLayout>
                }
              />

              {/* Rota de 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ShoppingCart />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
