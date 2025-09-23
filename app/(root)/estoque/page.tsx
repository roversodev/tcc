"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  IconPlus, 
  IconSearch, 
  IconPackage, 
  IconAlertTriangle, 
  IconTrendingUp, 
  IconEdit, 
  IconTrash,
  IconBarcode,
  IconBuilding,
  IconCalendar,
  IconCurrencyReal
} from "@tabler/icons-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Produto {
  id: string
  nome: string
  codigo: string
  categoria: "Produtos de Beleza" | "Equipamentos" | "Produtos de Limpeza" | "Materiais Descartáveis" | "Acessórios"
  preco: number
  quantidade: number
  estoqueMinimo: number
  fornecedor: string
  dataUltimaEntrada: string
  status: "Ativo" | "Inativo" | "Estoque Baixo"
  descricao: string
  unidade: "un" | "kg" | "L" | "ml" | "g"
}

const produtosIniciais: Produto[] = [
  {
    id: "1",
    nome: "Shampoo Profissional 1L",
    codigo: "SHP001",
    categoria: "Produtos de Beleza",
    preco: 45.90,
    quantidade: 12,
    estoqueMinimo: 5,
    fornecedor: "Beleza & Cia",
    dataUltimaEntrada: "2024-01-10",
    status: "Ativo",
    descricao: "Shampoo profissional para todos os tipos de cabelo",
    unidade: "un"
  },
  {
    id: "2",
    nome: "Condicionador Hidratante 1L",
    codigo: "CND001",
    categoria: "Produtos de Beleza",
    preco: 42.50,
    quantidade: 8,
    estoqueMinimo: 5,
    fornecedor: "Beleza & Cia",
    dataUltimaEntrada: "2024-01-10",
    status: "Ativo",
    descricao: "Condicionador hidratante para cabelos ressecados",
    unidade: "un"
  },
  {
    id: "3",
    nome: "Máquina de Corte Profissional",
    codigo: "EQP001",
    categoria: "Equipamentos",
    preco: 280.00,
    quantidade: 2,
    estoqueMinimo: 1,
    fornecedor: "Equipamentos Pro",
    dataUltimaEntrada: "2023-12-15",
    status: "Ativo",
    descricao: "Máquina de corte profissional com lâminas de cerâmica",
    unidade: "un"
  },
  {
    id: "4",
    nome: "Toalhas Descartáveis",
    codigo: "DSC001",
    categoria: "Materiais Descartáveis",
    preco: 25.90,
    quantidade: 3,
    estoqueMinimo: 10,
    fornecedor: "Descartáveis Express",
    dataUltimaEntrada: "2024-01-05",
    status: "Estoque Baixo",
    descricao: "Pacote com 100 toalhas descartáveis",
    unidade: "un"
  },
  {
    id: "5",
    nome: "Desinfetante Multiuso 5L",
    codigo: "LMP001",
    categoria: "Produtos de Limpeza",
    preco: 18.50,
    quantidade: 6,
    estoqueMinimo: 3,
    fornecedor: "Limpeza Total",
    dataUltimaEntrada: "2024-01-08",
    status: "Ativo",
    descricao: "Desinfetante multiuso para limpeza geral",
    unidade: "un"
  },
  {
    id: "6",
    nome: "Pentes Profissionais Kit",
    codigo: "ACC001",
    categoria: "Acessórios",
    preco: 35.00,
    quantidade: 1,
    estoqueMinimo: 2,
    fornecedor: "Acessórios Pro",
    dataUltimaEntrada: "2023-12-20",
    status: "Estoque Baixo",
    descricao: "Kit com 6 pentes profissionais de diferentes tamanhos",
    unidade: "un"
  },
  {
    id: "7",
    nome: "Creme para Pentear 300ml",
    codigo: "CRM001",
    categoria: "Produtos de Beleza",
    preco: 28.90,
    quantidade: 15,
    estoqueMinimo: 8,
    fornecedor: "Beleza & Cia",
    dataUltimaEntrada: "2024-01-12",
    status: "Ativo",
    descricao: "Creme para pentear com proteção térmica",
    unidade: "un"
  },
  {
    id: "8",
    nome: "Álcool 70% - 1L",
    codigo: "LMP002",
    categoria: "Produtos de Limpeza",
    preco: 12.90,
    quantidade: 0,
    estoqueMinimo: 5,
    fornecedor: "Limpeza Total",
    dataUltimaEntrada: "2023-12-28",
    status: "Estoque Baixo",
    descricao: "Álcool 70% para desinfecção",
    unidade: "un"
  }
]

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais)
  const [busca, setBusca] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas")
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)

  const produtosFiltrados = produtos.filter(produto => {
    const matchBusca = produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      produto.codigo.toLowerCase().includes(busca.toLowerCase()) ||
                      produto.categoria.toLowerCase().includes(busca.toLowerCase())
    
    const matchCategoria = filtroCategoria === "todas" || produto.categoria === filtroCategoria
    const matchStatus = filtroStatus === "todos" || produto.status === filtroStatus
    
    return matchBusca && matchCategoria && matchStatus
  })

  const abrirDialogProduto = (produto?: Produto) => {
    if (produto) {
      setProdutoSelecionado(produto)
      setModoEdicao(true)
    } else {
      setProdutoSelecionado(null)
      setModoEdicao(false)
    }
    setDialogAberto(true)
  }

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case "Produtos de Beleza": return "bg-pink-100 text-pink-800 border-pink-200"
      case "Equipamentos": return "bg-blue-100 text-blue-800 border-blue-200"
      case "Produtos de Limpeza": return "bg-green-100 text-green-800 border-green-200"
      case "Materiais Descartáveis": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Acessórios": return "bg-purple-100 text-purple-800 border-purple-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo": return "bg-green-100 text-green-800 border-green-200"
      case "Inativo": return "bg-gray-100 text-gray-800 border-gray-200"
      case "Estoque Baixo": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const produtosEstoqueBaixo = produtos.filter(p => p.quantidade <= p.estoqueMinimo)
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + (p.preco * p.quantidade), 0)
  const produtosAtivos = produtos.filter(p => p.status === "Ativo")

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Controle de Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie seus produtos e mantenha o controle do seu estoque
          </p>
        </div>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button onClick={() => abrirDialogProduto()}>
              <IconPlus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {modoEdicao ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                {modoEdicao ? "Atualize as informações do produto" : "Adicione um novo produto ao seu estoque"}
              </DialogDescription>
            </DialogHeader>
            <FormularioProduto produto={produtoSelecionado} onClose={() => setDialogAberto(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Alertas de Estoque Baixo */}
      {produtosEstoqueBaixo.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <IconAlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Atenção!</strong> Você tem {produtosEstoqueBaixo.length} produto(s) com estoque baixo:
            <span className="ml-2 font-medium">
              {produtosEstoqueBaixo.map(p => p.nome).join(", ")}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, código ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            <SelectItem value="Produtos de Beleza">Produtos de Beleza</SelectItem>
            <SelectItem value="Equipamentos">Equipamentos</SelectItem>
            <SelectItem value="Produtos de Limpeza">Produtos de Limpeza</SelectItem>
            <SelectItem value="Materiais Descartáveis">Materiais Descartáveis</SelectItem>
            <SelectItem value="Acessórios">Acessórios</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
            <SelectItem value="Estoque Baixo">Estoque Baixo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <IconPackage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtosAtivos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <IconAlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{produtosEstoqueBaixo.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <IconCurrencyReal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Produtos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {produtosFiltrados.map((produto) => (
          <Card key={produto.id} className={`hover:shadow-md transition-shadow ${
            produto.quantidade <= produto.estoqueMinimo ? 'border-red-200' : ''
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{produto.nome}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getCategoriaColor(produto.categoria)}>
                      {produto.categoria}
                    </Badge>
                    <Badge className={getStatusColor(produto.status)}>
                      {produto.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-muted-foreground">
                    <IconBarcode className="mr-2 h-4 w-4" />
                    <span>Código:</span>
                  </div>
                  <span className="font-medium">{produto.codigo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-muted-foreground">
                    <IconPackage className="mr-2 h-4 w-4" />
                    <span>Estoque:</span>
                  </div>
                  <span className={`font-medium ${
                    produto.quantidade <= produto.estoqueMinimo ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {produto.quantidade} {produto.unidade}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-muted-foreground">
                    <IconCurrencyReal className="mr-2 h-4 w-4" />
                    <span>Preço:</span>
                  </div>
                  <span className="font-medium">
                    R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-muted-foreground">
                    <IconBuilding className="mr-2 h-4 w-4" />
                    <span>Fornecedor:</span>
                  </div>
                  <span className="font-medium truncate">{produto.fornecedor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-muted-foreground">
                    <IconCalendar className="mr-2 h-4 w-4" />
                    <span>Última entrada:</span>
                  </div>
                  <span className="font-medium">
                    {format(new Date(produto.dataUltimaEntrada), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
              
              {produto.quantidade <= produto.estoqueMinimo && (
                <div className="pt-2 border-t border-red-200">
                  <div className="flex items-center text-red-600 text-sm">
                    <IconAlertTriangle className="mr-2 h-4 w-4" />
                    <span className="font-medium">
                      Estoque baixo! Mínimo: {produto.estoqueMinimo} {produto.unidade}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valor total:</span>
                  <span className="font-semibold text-green-600">
                    R$ {(produto.preco * produto.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => abrirDialogProduto(produto)}
                >
                  <IconEdit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    // Função para adicionar estoque (será implementada)
                    console.log('Adicionar estoque para:', produto.nome)
                  }}
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Estoque
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {produtosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <IconPackage className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground">
            {busca || filtroCategoria !== "todas" || filtroStatus !== "todos"
              ? "Tente ajustar os filtros de busca" 
              : "Comece adicionando seu primeiro produto"}
          </p>
        </div>
      )}
    </div>
  )
}

// Componente do formulário completo
function FormularioProduto({ produto, onClose }: { produto: Produto | null, onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<Produto>>({
    nome: produto?.nome || "",
    codigo: produto?.codigo || "",
    categoria: produto?.categoria || "Produtos de Beleza",
    preco: produto?.preco || 0,
    quantidade: produto?.quantidade || 0,
    estoqueMinimo: produto?.estoqueMinimo || 1,
    fornecedor: produto?.fornecedor || "",
    dataUltimaEntrada: produto?.dataUltimaEntrada || new Date().toISOString().split('T')[0],
    status: produto?.status || "Ativo",
    descricao: produto?.descricao || "",
    unidade: produto?.unidade || "un"
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof Produto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nome?.trim()) {
      newErrors.nome = "Nome é obrigatório"
    }

    if (!formData.codigo?.trim()) {
      newErrors.codigo = "Código é obrigatório"
    }

    if (!formData.preco || formData.preco <= 0) {
      newErrors.preco = "Preço deve ser maior que zero"
    }

    if (formData.quantidade === undefined || formData.quantidade < 0) {
      newErrors.quantidade = "Quantidade deve ser maior ou igual a zero"
    }

    if (!formData.estoqueMinimo || formData.estoqueMinimo < 0) {
      newErrors.estoqueMinimo = "Estoque mínimo deve ser maior ou igual a zero"
    }

    if (!formData.fornecedor?.trim()) {
      newErrors.fornecedor = "Fornecedor é obrigatório"
    }

    if (!formData.dataUltimaEntrada) {
      newErrors.dataUltimaEntrada = "Data da última entrada é obrigatória"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Aqui você implementaria a lógica para salvar o produto
    // Por exemplo, chamada para API ou atualização do estado
    console.log('Salvando produto:', formData)
    
    // Simular salvamento
    alert(produto ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!')
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome do Produto */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome do Produto *</label>
          <Input
            value={formData.nome}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            placeholder="Ex: Shampoo Profissional"
            className={errors.nome ? "border-red-500" : ""}
          />
          {errors.nome && <p className="text-sm text-red-500">{errors.nome}</p>}
        </div>

        {/* Código */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Código *</label>
          <div className="relative">
            <IconBarcode className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={formData.codigo}
              onChange={(e) => handleInputChange('codigo', e.target.value.toUpperCase())}
              placeholder="Ex: SHP001"
              className={`pl-10 ${errors.codigo ? "border-red-500" : ""}`}
            />
          </div>
          {errors.codigo && <p className="text-sm text-red-500">{errors.codigo}</p>}
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Categoria *</label>
          <Select
            value={formData.categoria}
            onValueChange={(value) => handleInputChange('categoria', value as Produto['categoria'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Produtos de Beleza">Produtos de Beleza</SelectItem>
              <SelectItem value="Equipamentos">Equipamentos</SelectItem>
              <SelectItem value="Produtos de Limpeza">Produtos de Limpeza</SelectItem>
              <SelectItem value="Materiais Descartáveis">Materiais Descartáveis</SelectItem>
              <SelectItem value="Acessórios">Acessórios</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Unidade */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Unidade *</label>
          <Select
            value={formData.unidade}
            onValueChange={(value) => handleInputChange('unidade', value as Produto['unidade'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="un">Unidade (un)</SelectItem>
              <SelectItem value="kg">Quilograma (kg)</SelectItem>
              <SelectItem value="L">Litro (L)</SelectItem>
              <SelectItem value="ml">Mililitro (ml)</SelectItem>
              <SelectItem value="g">Grama (g)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preço */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Preço Unitário (R$) *</label>
          <div className="relative">
            <IconCurrencyReal className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.preco}
              onChange={(e) => handleInputChange('preco', parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              className={`pl-10 ${errors.preco ? "border-red-500" : ""}`}
            />
          </div>
          {errors.preco && <p className="text-sm text-red-500">{errors.preco}</p>}
        </div>

        {/* Quantidade */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quantidade em Estoque *</label>
          <Input
            type="number"
            min="0"
            value={formData.quantidade}
            onChange={(e) => handleInputChange('quantidade', parseInt(e.target.value) || 0)}
            placeholder="0"
            className={errors.quantidade ? "border-red-500" : ""}
          />
          {errors.quantidade && <p className="text-sm text-red-500">{errors.quantidade}</p>}
        </div>

        {/* Estoque Mínimo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Estoque Mínimo *</label>
          <Input
            type="number"
            min="0"
            value={formData.estoqueMinimo}
            onChange={(e) => handleInputChange('estoqueMinimo', parseInt(e.target.value) || 0)}
            placeholder="1"
            className={errors.estoqueMinimo ? "border-red-500" : ""}
          />
          {errors.estoqueMinimo && <p className="text-sm text-red-500">{errors.estoqueMinimo}</p>}
        </div>

        {/* Fornecedor */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Fornecedor *</label>
          <div className="relative">
            <IconBuilding className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={formData.fornecedor}
              onChange={(e) => handleInputChange('fornecedor', e.target.value)}
              placeholder="Ex: Beleza & Cia"
              className={`pl-10 ${errors.fornecedor ? "border-red-500" : ""}`}
            />
          </div>
          {errors.fornecedor && <p className="text-sm text-red-500">{errors.fornecedor}</p>}
        </div>

        {/* Data da Última Entrada */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Data da Última Entrada *</label>
          <div className="relative">
            <IconCalendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={formData.dataUltimaEntrada}
              onChange={(e) => handleInputChange('dataUltimaEntrada', e.target.value)}
              className={`pl-10 ${errors.dataUltimaEntrada ? "border-red-500" : ""}`}
            />
          </div>
          {errors.dataUltimaEntrada && <p className="text-sm text-red-500">{errors.dataUltimaEntrada}</p>}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleInputChange('status', value as Produto['status'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
              <SelectItem value="Estoque Baixo">Estoque Baixo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Descrição</label>
        <textarea
          value={formData.descricao}
          onChange={(e) => handleInputChange('descricao', e.target.value)}
          placeholder="Descrição detalhada do produto..."
          className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none rounded-md"
          rows={3}
        />
      </div>

      {/* Informações Calculadas */}
      {formData.preco && formData.quantidade !== undefined && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Informações Calculadas</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Valor Total em Estoque:</span>
              <p className="font-semibold text-green-600">
                R$ {(formData.preco * formData.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Status do Estoque:</span>
              <p className={`font-medium ${
                formData.quantidade === 0 
                  ? 'text-red-600' 
                  : formData.quantidade <= (formData.estoqueMinimo || 0)
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                {formData.quantidade === 0 
                  ? 'Sem Estoque' 
                  : formData.quantidade <= (formData.estoqueMinimo || 0)
                  ? 'Estoque Baixo'
                  : 'Estoque Normal'
                }
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Diferença do Mínimo:</span>
              <p className={`font-medium ${
                formData.quantidade <= (formData.estoqueMinimo || 0) ? 'text-red-600' : 'text-green-600'
              }`}>
                {formData.quantidade - (formData.estoqueMinimo || 0) >= 0 ? '+' : ''}
                {formData.quantidade - (formData.estoqueMinimo || 0)} {formData.unidade}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          <IconPackage className="mr-2 h-4 w-4" />
          {produto ? 'Atualizar Produto' : 'Criar Produto'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}