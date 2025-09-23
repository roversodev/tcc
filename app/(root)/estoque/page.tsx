"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
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
  IconCurrencyReal,
  IconLoader2,
  IconX
} from "@tabler/icons-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useProducts } from "@/hooks/use-products"
import { Product, ProductCategory } from "@/lib/database.types"
import { toast } from "sonner"

export default function EstoquePage() {
  const { 
    products, 
    categories, 
    loading, 
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    updateStock,
    lowStockProducts,
    totalStockValue
  } = useProducts()

  const [busca, setBusca] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas")
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [produtoSelecionado, setProdutoSelecionado] = useState<Product | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [dialogEstoque, setDialogEstoque] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState("")
  const [mostrarNovaCategoria, setMostrarNovaCategoria] = useState(false)

  const produtosFiltrados = products.filter(produto => {
    const matchBusca = produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      produto.codigo?.toLowerCase().includes(busca.toLowerCase()) ||
                      (produto.categoria_id || '').toLowerCase().includes(busca.toLowerCase())
    
    const matchCategoria = filtroCategoria === "todas" || produto.categoria_id === filtroCategoria
    const matchStatus = filtroStatus === "todos" || produto.status === filtroStatus
    
    return matchBusca && matchCategoria && matchStatus
  })

  const abrirDialogProduto = (produto?: Product) => {
    if (produto) {
      setProdutoSelecionado(produto)
      setModoEdicao(true)
    } else {
      setProdutoSelecionado(null)
      setModoEdicao(false)
    }
    setDialogAberto(true)
  }

  const abrirDialogEstoque = (produto: Product) => {
    setProdutoSelecionado(produto)
    setDialogEstoque(true)
  }

  const getCategoriaColor = (categoriaId: string | null) => {
    if (!categoriaId) return "bg-gray-100 text-gray-800 border-gray-200"
    
    const categoria = categories.find(c => c.id === categoriaId)
    if (!categoria) return "bg-gray-100 text-gray-800 border-gray-200"
    
    // Cores baseadas no hash do nome da categoria para consistência
    const hash = categoria.name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const colors = [
      "bg-pink-100 text-pink-800 border-pink-200",
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-green-100 text-green-800 border-green-200",
      "bg-yellow-100 text-yellow-800 border-yellow-200",
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200",
      "bg-red-100 text-red-800 border-red-200",
      "bg-orange-100 text-orange-800 border-orange-200"
    ]
    
    return colors[Math.abs(hash) % colors.length]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo": return "bg-green-100 text-green-800 border-green-200"
      case "Inativo": return "bg-gray-100 text-gray-800 border-gray-200"
      case "Estoque Baixo": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const produtosAtivos = products.filter(p => p.status === "Ativo")

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <IconLoader2 className="h-6 w-6 animate-spin" />
          <span>Carregando produtos...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Alert className="max-w-md">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar produtos: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

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
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {modoEdicao ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                {modoEdicao ? "Atualize as informações do produto" : "Adicione um novo produto ao seu estoque"}
              </DialogDescription>
            </DialogHeader>
            <FormularioProduto 
              produto={produtoSelecionado} 
              categorias={categories}
              onClose={() => setDialogAberto(false)}
              onSave={async (data) => {
                try {
                  if (modoEdicao && produtoSelecionado) {
                    await updateProduct(produtoSelecionado.id, data)
                    toast.success("Produto atualizado com sucesso!")
                  } else {
                    await createProduct(data)
                    toast.success("Produto criado com sucesso!")
                  }
                  setDialogAberto(false)
                } catch (error) {
                  toast.error("Erro ao salvar produto")
                  console.error(error)
                }
              }}
              onCreateCategory={async (name, description) => {
                try {
                  await createCategory(name, description)
                  toast.success("Categoria criada com sucesso!")
                } catch (error) {
                  toast.error("Erro ao criar categoria")
                  console.error(error)
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Alertas de Estoque Baixo */}
      {lowStockProducts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <IconAlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Atenção!</strong> Você tem {lowStockProducts.length} produto(s) com estoque baixo:
            <span className="ml-2 font-medium">
              {lowStockProducts.map(p => p.nome).join(", ")}
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
            {categories.map(categoria => (
              <SelectItem key={categoria.id} value={categoria.id}>
                {categoria.name}
              </SelectItem>
            ))}
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
            <div className="text-2xl font-bold">{products.length}</div>
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
            <div className="text-2xl font-bold text-red-600">{lowStockProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <IconCurrencyReal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Produtos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {produtosFiltrados.map((produto) => (
          <Card key={produto.id} className={`hover:shadow-md transition-shadow ${
            produto.quantidade <= produto.estoque_minimo ? 'border-red-200' : ''
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{produto.nome}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getCategoriaColor(produto.categoria_id)}>
                      {produto.categoria_id ? categories.find(c => c.id === produto.categoria_id)?.name || 'Sem categoria' : 'Sem categoria'}
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
                {produto.codigo && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-muted-foreground">
                      <IconBarcode className="mr-2 h-4 w-4" />
                      <span>Código:</span>
                    </div>
                    <span className="font-medium">{produto.codigo}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-muted-foreground">
                    <IconPackage className="mr-2 h-4 w-4" />
                    <span>Estoque:</span>
                  </div>
                  <span className={`font-medium ${
                    produto.quantidade <= produto.estoque_minimo ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {produto.quantidade} {produto.unidade}
                  </span>
                </div>
                {produto.preco && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-muted-foreground">
                      <IconCurrencyReal className="mr-2 h-4 w-4" />
                      <span>Preço:</span>
                    </div>
                    <span className="font-medium">
                      R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {produto.fornecedor && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-muted-foreground">
                      <IconBuilding className="mr-2 h-4 w-4" />
                      <span>Fornecedor:</span>
                    </div>
                    <span className="font-medium truncate">{produto.fornecedor}</span>
                  </div>
                )}
                {produto.data_ultima_entrada && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-muted-foreground">
                      <IconCalendar className="mr-2 h-4 w-4" />
                      <span>Última entrada:</span>
                    </div>
                    <span className="font-medium">
                      {format(new Date(produto.data_ultima_entrada), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
              
              {produto.quantidade <= produto.estoque_minimo && (
                <div className="pt-2 border-t border-red-200">
                  <div className="flex items-center text-red-600 text-sm">
                    <IconAlertTriangle className="mr-2 h-4 w-4" />
                    <span className="font-medium">
                      Estoque baixo! Mínimo: {produto.estoque_minimo} {produto.unidade}
                    </span>
                  </div>
                </div>
              )}
              
              {produto.preco && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valor total:</span>
                    <span className="font-semibold text-green-600">
                      R$ {(produto.preco * produto.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
              
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
                  onClick={() => abrirDialogEstoque(produto)}
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

      {/* Dialog para atualizar estoque */}
      <Dialog open={dialogEstoque} onOpenChange={setDialogEstoque}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Estoque</DialogTitle>
            <DialogDescription>
              Atualize a quantidade em estoque do produto: {produtoSelecionado?.nome}
            </DialogDescription>
          </DialogHeader>
          <DialogEstoque 
            produto={produtoSelecionado}
            onClose={() => setDialogEstoque(false)}
            onSave={async (quantidade) => {
              if (produtoSelecionado) {
                try {
                  await updateStock(produtoSelecionado.id, quantidade)
                  toast.success("Estoque atualizado com sucesso!")
                  setDialogEstoque(false)
                } catch (error) {
                  toast.error("Erro ao atualizar estoque")
                  console.error(error)
                }
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente do formulário de produto
function FormularioProduto({ 
  produto, 
  categorias, 
  onClose, 
  onSave, 
  onCreateCategory 
}: { 
  produto: Product | null
  categorias: ProductCategory[]
  onClose: () => void
  onSave: (data: any) => Promise<void>
  onCreateCategory: (name: string, description?: string) => Promise<void>
}) {
  const [formData, setFormData] = useState({
    nome: produto?.nome || "",
    codigo: produto?.codigo || "",
    categoria_id: produto?.categoria_id || "",
    preco: produto?.preco || 0,
    cost_price: produto?.cost_price || 0,
    quantidade: produto?.quantidade || 0,
    estoque_minimo: produto?.estoque_minimo || 1,
    fornecedor: produto?.fornecedor || "",
    data_ultima_entrada: produto?.data_ultima_entrada || new Date().toISOString().split('T')[0],
    status: produto?.status || "Ativo" as const,
    descricao: produto?.descricao || "",
    unidade: produto?.unidade || "un" as const
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState({ nome: "", descricao: "" })
  const [mostrarNovaCategoria, setMostrarNovaCategoria] = useState(false)

  const handleInputChange = (field: string, value: any) => {
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

    if (!formData.estoque_minimo || formData.estoque_minimo < 0) {
      newErrors.estoque_minimo = "Estoque mínimo deve ser maior ou igual a zero"
    }

    if (!formData.fornecedor?.trim()) {
      newErrors.fornecedor = "Fornecedor é obrigatório"
    }

    if (!formData.data_ultima_entrada) {
      newErrors.data_ultima_entrada = "Data da última entrada é obrigatória"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // Preparar dados para envio, garantindo que valores vazios sejam null
      const dataToSave = {
        ...formData,
        codigo: formData.codigo?.trim() || null,
        categoria_id: formData.categoria_id || null,
        fornecedor: formData.fornecedor?.trim() || null,
        descricao: formData.descricao?.trim() || null,
        data_ultima_entrada: formData.data_ultima_entrada || null,
        // Garantir que números sejam válidos
        preco: Number(formData.preco) || 0,
        cost_price: Number(formData.cost_price) || 0,
        quantidade: Number(formData.quantidade) || 0,
        estoque_minimo: Number(formData.estoque_minimo) || 0,
      }

      console.log('Dados a serem salvos:', dataToSave)
      
      await onSave(dataToSave)
      onClose()
    } catch (error) {
      console.error('Erro no formulário:', error)
      toast.error("Erro ao salvar produto")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!novaCategoria.nome.trim()) {
      toast.error("Nome da categoria é obrigatório")
      return
    }

    try {
      await onCreateCategory(novaCategoria.nome, novaCategoria.descricao)
      setNovaCategoria({ nome: "", descricao: "" })
      setMostrarNovaCategoria(false)
    } catch (error) {
      console.error(error)
    }
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
          <label className="text-sm font-medium">Categoria</label>
          <div className="flex gap-2">
            <Select value={formData.categoria_id} onValueChange={(value) => handleInputChange('categoria_id', value)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(categoria => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMostrarNovaCategoria(!mostrarNovaCategoria)}
            >
              <IconPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Unidade */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Unidade *</label>
          <Select
            value={formData.unidade}
            onValueChange={(value) => handleInputChange('unidade', value)}
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

        {/* Preço de Custo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Preço de Custo (R$)</label>
          <div className="relative">
            <IconCurrencyReal className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_price}
              onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              className="pl-10"
            />
          </div>
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
            value={formData.estoque_minimo}
            onChange={(e) => handleInputChange('estoque_minimo', parseInt(e.target.value) || 0)}
            placeholder="1"
            className={errors.estoque_minimo ? "border-red-500" : ""}
          />
          {errors.estoque_minimo && <p className="text-sm text-red-500">{errors.estoque_minimo}</p>}
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
              value={formData.data_ultima_entrada}
              onChange={(e) => handleInputChange('data_ultima_entrada', e.target.value)}
              className={`pl-10 ${errors.data_ultima_entrada ? "border-red-500" : ""}`}
            />
          </div>
          {errors.data_ultima_entrada && <p className="text-sm text-red-500">{errors.data_ultima_entrada}</p>}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleInputChange('status', value)}
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

      {/* Nova Categoria */}
      {mostrarNovaCategoria && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Nova Categoria</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMostrarNovaCategoria(false)}
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Categoria *</label>
              <Input
                value={novaCategoria.nome}
                onChange={(e) => setNovaCategoria(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Produtos de Beleza"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={novaCategoria.descricao}
                onChange={(e) => setNovaCategoria(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição da categoria"
              />
            </div>
          </div>
          <Button type="button" onClick={handleCreateCategory} size="sm">
            Criar Categoria
          </Button>
        </div>
      )}

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
                  : formData.quantidade <= (formData.estoque_minimo || 0)
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                {formData.quantidade === 0
                  ? 'Sem Estoque'
                  : formData.quantidade <= (formData.estoque_minimo || 0)
                  ? 'Estoque Baixo'
                  : 'Estoque Normal'
                }
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Diferença do Mínimo:</span>
              <p className={`font-medium ${
                formData.quantidade <= (formData.estoque_minimo || 0) ? 'text-red-600' : 'text-green-600'
              }`}>
                {formData.quantidade - (formData.estoque_minimo || 0) >= 0 ? '+' : ''}
                {formData.quantidade - (formData.estoque_minimo || 0)} {formData.unidade}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
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

// Componente do dialog de estoque
function DialogEstoque({ 
  produto, 
  onClose, 
  onSave 
}: { 
  produto: Product | null
  onClose: () => void
  onSave: (quantidade: number) => Promise<void>
}) {
  const [quantidade, setQuantidade] = useState(produto?.quantidade || 0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (quantidade < 0) {
      toast.error("Quantidade deve ser maior ou igual a zero")
      return
    }

    setLoading(true)
    try {
      await onSave(quantidade)
    } finally {
      setLoading(false)
    }
  }

  if (!produto) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantidade_estoque">Nova Quantidade</Label>
        <Input
          id="quantidade_estoque"
          type="number"
          min="0"
          value={quantidade}
          onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
          placeholder="Digite a nova quantidade"
        />
        <p className="text-sm text-muted-foreground">
          Quantidade atual: {produto.quantidade} {produto.unidade}
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          Atualizar Estoque
        </Button>
      </div>
    </form>
  )
}