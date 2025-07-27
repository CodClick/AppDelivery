import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient"; // Importação original do Supabase
import { useNavigate } from "react-router-dom"; // Importe useNavigate para navegação
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Importação original do toast
import { Textarea } from "@/components/ui/textarea"; // Importar Textarea para a descrição

// Se você tiver um hook de autenticação (ex: useAuth), descomente a linha abaixo
// import { useAuth } from "@/hooks/useAuth";

export default function AdminCupons() {
  const [cupons, setCupons] = useState<any[]>([]);
  const [open, setOpen] = useState(false); // Controla o diálogo de criar/editar
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "percentual",
    valor: "",
    validade: "",
    descricao: "", // Adicionado campo de descrição
  });
  const [editingCupom, setEditingCupom] = useState<any | null>(null); // Armazena o cupom sendo editado

  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Controla o diálogo de confirmação de exclusão
  const [cupomToDelete, setCupomToDelete] = useState<any | null>(null); // Armazena o cupom a ser excluído

  const navigate = useNavigate(); // Usa o useNavigate real
  // Se você tiver um hook de autenticação, obtenha logOut dele:
  // const { logOut } = useAuth();
  // Caso contrário, você pode definir uma função logOut simples aqui:
  const logOut = async () => {
    await supabase.auth.signOut();
    navigate("/"); // Redireciona para a página inicial após o logout
  };


  // 🔐 Buscar o ID da empresa do admin logado
  useEffect(() => {
    const fetchEmpresaId = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Erro de autenticação:", authError?.message);
        return;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        console.error("Erro ao buscar empresa_id:", error?.message);
        return;
      }

      setEmpresaId(data.empresa_id);
    };

    fetchEmpresaId();
  }, []);

  const fetchCupons = async () => {
    if (!empresaId) return; // Garante que o empresaId esteja disponível antes de buscar

    const { data, error } = await supabase
      .from("cupons")
      .select("*, descricao") // Adicionado 'descricao' na seleção
      .eq("empresa_id", empresaId);

    if (error) {
      console.error("Erro ao buscar cupons:", error.message);
    } else {
      setCupons(data || []);
    }
  };

  useEffect(() => {
    if (empresaId) fetchCupons();
  }, [empresaId]); // Busca os cupons novamente quando o empresaId muda

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { // Adicionado HTMLTextAreaElement
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenCreateDialog = () => {
    setEditingCupom(null); // Limpa qualquer estado de edição
    setFormData({ nome: "", tipo: "percentual", valor: "", validade: "", descricao: "" }); // Reseta o formulário e inclui descrição
    setOpen(true);
  };

  const handleEditClick = (cupom: any) => {
    setEditingCupom(cupom);
    setFormData({
      nome: cupom.nome,
      tipo: cupom.tipo,
      valor: String(cupom.valor).replace(".", ","), // Converte para string e usa vírgula para o input
      validade: cupom.validade, // Assume que 'validade' já está no formato 'YYYY-MM-DD'
      descricao: cupom.descricao || "", // Preenche a descrição, ou string vazia se não existir
    });
    setOpen(true);
  };

  const handleDeleteClick = (cupom: any) => {
    setCupomToDelete(cupom);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!cupomToDelete) return;

    const { error } = await supabase
      .from("cupons")
      .delete()
      .eq("id", cupomToDelete.id);

    if (error) {
      console.error("Erro ao excluir cupom:", error.message);
      toast.error("Erro ao excluir cupom!");
    } else {
      toast.success("Cupom excluído com sucesso!");
      fetchCupons(); // Atualiza a lista
    }
    setShowDeleteConfirm(false);
    setCupomToDelete(null);
  };

  const handleSubmit = async () => {
    const { nome, tipo, valor, validade, descricao } = formData; // Incluído descricao

    if (!nome || !valor || !validade || !empresaId) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    const valorNumber = parseFloat(valor.replace(",", "."));

    if (editingCupom) {
      // Atualiza o cupom existente
      const { error } = await supabase
        .from("cupons")
        .update({
          nome,
          tipo,
          valor: valorNumber,
          validade,
          descricao, // Incluído descricao na atualização
        })
        .eq("id", editingCupom.id);

      if (error) {
        console.error("Erro ao atualizar cupom:", error.message);
        toast.error("Erro ao atualizar cupom!");
      } else {
        toast.success("Cupom atualizado com sucesso!");
        setOpen(false);
        setEditingCupom(null); // Limpa o estado de edição
        fetchCupons(); // Atualiza a lista
      }
    } else {
      // Cria um novo cupom
      const { error } = await supabase.from("cupons").insert([
        {
          nome,
          tipo,
          valor: valorNumber,
          validade,
          empresa_id: empresaId,
          descricao, // Incluído descricao na criação
        },
      ]);

      if (error) {
        console.error("Erro ao criar cupom:", error.message);
        toast.error("Erro ao criar cupom!");
      } else {
        toast.success("Cupom criado com sucesso!");
        setOpen(false);
        setFormData({ nome: "", tipo: "percentual", valor: "", validade: "", descricao: "" }); // Reseta o formulário e inclui descrição
        fetchCupons(); // Atualiza a lista
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cupons de Desconto</h1>
        <div className="flex gap-2 items-center"> {/* Container para os botões de navegação e criar */}
          <Button
            onClick={() => navigate("/admin-dashboard")}
            className="bg-[#fa6500] hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center gap-2"
          >
            {/* ArrowLeft Icon (SVG) */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
              <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
            </svg>
            Dashboard
          </Button>
          <Button
            onClick={logOut} // Usa a função de logout
            className="bg-[#b40000] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center gap-2"
          >
            {/* LogOut Icon (SVG) */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="17 16 22 12 17 8"/><line x1="22" x2="10" y1="12" y2="12"/>
            </svg>
            Sair
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out">
                Criar Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white p-6 rounded-lg shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-800">
                  {editingCupom ? "Editar Cupom" : "Novo Cupom"}
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  {editingCupom ? "Edite os dados do cupom." : "Preencha os dados para criar um novo cupom."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Código do Cupom</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="EX: BEMVINDO10"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">Descrição</Label>
                  <Textarea // Usando Textarea para a descrição
                    id="descricao"
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    placeholder="Descreva o propósito do cupom (ex: Desconto para primeira compra)"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Desconto</Label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2 bg-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="percentual">Porcentagem (%)</option>
                    <option value="fixo">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">Valor</Label>
                  <Input
                    id="valor"
                    name="valor"
                    value={formData.valor}
                    onChange={handleChange}
                    placeholder={formData.tipo === "percentual" ? "Ex: 10 (%)" : "Ex: 5.00 (R$)"}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="validade" className="block text-sm font-medium text-gray-700 mb-1">Validade</Label>
                  <Input
                    id="validade"
                    type="date"
                    name="validade"
                    value={formData.validade}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out">
                  {editingCupom ? "Atualizar Cupom" : "Salvar Cupom"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cupons.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 text-lg py-8">Nenhum cupom encontrado.</p>
        ) : (
          cupons.map((cupom) => (
            <div key={cupom.id} className="p-5 border border-gray-200 rounded-lg shadow-sm bg-white flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{cupom.nome}</h2>
                {cupom.descricao && ( // Exibe a descrição se ela existir
                  <p className="text-gray-600 text-sm mb-2 italic">{cupom.descricao}</p>
                )}
                <p className="text-gray-700 mb-1">
                  Desconto:{" "}
                  {cupom.tipo === "percentual"
                    ? `${cupom.valor}%`
                    : `R$ ${cupom.valor.toFixed(2).replace(".", ",")}`}
                </p>
                <p className="text-gray-700 text-sm">Válido até: {new Date(cupom.validade).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditClick(cupom)}
                  className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition duration-200"
                  title="Editar Cupom"
                >
                  {/* Pencil Icon (SVG) */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    <path d="m15 5 4 4"/>
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(cupom)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition duration-200"
                  title="Excluir Cupom"
                >
                  {/* Trash Icon (SVG) */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    <line x1="10" x2="10" y1="11" y2="17"/>
                    <line x1="14" x2="14" y1="11" y2="17"/>
                  </svg>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-white p-6 rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-gray-600">
              Tem certeza de que deseja excluir o cupom "{cupomToDelete?.nome}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 py-2 px-4 rounded-lg transition duration-300"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
                            }
                    
