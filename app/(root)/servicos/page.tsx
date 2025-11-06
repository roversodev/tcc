"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  IconPlus, 
  IconSearch, 
  IconClock, 
  IconCurrencyReal, 
  IconEdit, 
  IconTrash,
  IconLoader2,
  IconSettings,
  IconActivity
} from "@tabler/icons-react"
import { useServices } from "@/hooks/use-services"
import { Product, Service } from "@/lib/database.types"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useProducts } from "@/hooks/use-products"

export default function ServicosPage() {
  const { 
    services, 
    loading, 
    error,
    servicesStats,
    createService,
    updateService,
    deleteService,
    permanentDeleteService,
    // ADICIONAR: função para persistir materiais
    setServiceMaterials,
  } = useServices()

  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [servicoSelecionado, setServicoSelecionado] = useState<Service | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
   const [servicoParaExcluir, setServicoParaExcluir] = useState<Service | null>(null)
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false)

  const abrirModalExclusao = (servico: Service) => {
    setServicoParaExcluir(servico)
    setModalExclusaoAberto(true)
  }

  const fecharModalExclusao = () => {
    setModalExclusaoAberto(false)
    setServicoParaExcluir(null)
  }

  const handleConfirmarExclusao = async () => {
    if (!servicoParaExcluir) return

    try {
      if (servicoParaExcluir.status === 'Ativo') {
        await deleteService(servicoParaExcluir.id)
        toast.success("Serviço inativado com sucesso!")
      } else {
        await permanentDeleteService(servicoParaExcluir.id)
        toast.success("Serviço excluído permanentemente!")
      }
      fecharModalExclusao()
    } catch (error) {
      toast.error("Erro ao processar exclusão")
      console.error(error)
    }
  }

  const servicosFiltrados = services.filter(servico => {
    const matchBusca = servico.header.toLowerCase().includes(busca.toLowerCase()) ||
                      (servico.description || '').toLowerCase().includes(busca.toLowerCase()) ||
                      servico.type.toLowerCase().includes(busca.toLowerCase())
    
    const matchStatus = filtroStatus === "todos" || servico.status === filtroStatus
    
    return matchBusca && matchStatus
  })

  const abrirDialogNovo = () => {
    setServicoSelecionado(null)
    setModoEdicao(false)
    setDialogAberto(true)
  }

  const abrirDialogEdicao = (servico: Service) => {
    setServicoSelecionado(servico)
    setModoEdicao(true)
    setDialogAberto(true)
  }

  const fecharDialog = () => {
    setDialogAberto(false)
    setServicoSelecionado(null)
    setModoEdicao(false)
  }

  const handleExcluirServico = async (id: string) => {
    if (confirm("Tem certeza que deseja inativar este serviço?")) {
      try {
        await deleteService(id)
        toast.success("Serviço inativado com sucesso!")
      } catch (error) {
        toast.error("Erro ao inativar serviço")
        console.error(error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <IconLoader2 className="h-6 w-6 animate-spin" />
          <span>Carregando serviços...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie os serviços oferecidos pela sua empresa
          </p>
        </div>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button onClick={abrirDialogNovo}>
              <IconPlus className="mr-2 h-4 w-4" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {modoEdicao ? "Editar Serviço" : "Novo Serviço"}
              </DialogTitle>
              <DialogDescription>
                {modoEdicao 
                  ? "Atualize as informações do serviço" 
                  : "Adicione um novo serviço ao seu catálogo"
                }
              </DialogDescription>
            </DialogHeader>
            <FormularioServico 
              servico={servicoSelecionado}
              onSalvar={async (dados) => {
                try {
                  // separe o payload do serviço dos materiais
                  const materiais = dados.materials || []
                  const dadosServico = {
                    header: dados.header,
                    type: dados.type,
                    status: dados.status,
                    target: dados.target,
                    description: dados.description,
                    duration_minutes: dados.duration_minutes,
                  }

                  if (modoEdicao && servicoSelecionado) {
                    await updateService(servicoSelecionado.id, dadosServico)
                    await setServiceMaterials(servicoSelecionado.id, materiais)
                    toast.success("Serviço atualizado com materiais!")
                  } else {
                    const created = await createService(dadosServico)
                    await setServiceMaterials(created.id, materiais)
                    toast.success("Serviço criado com materiais!")
                  }
                  fecharDialog()
                } catch (error) {
                  const msg = (error as any)?.message || "Erro ao salvar serviço e materiais"
                  toast.error(msg)
                  console.error("Erro ao salvar serviço e materiais:", error)
                }
              }}
              onCancelar={fecharDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            <IconSettings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servicesStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
            <IconActivity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{servicesStats.ativos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servicesStats.duracaoMedia}min</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
            <IconCurrencyReal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {servicesStats.precoMedio > 0 
                ? `R$ ${servicesStats.precoMedio.toFixed(2)}`
                : "N/A"
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar serviços..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Ativo">Ativos</SelectItem>
            <SelectItem value="Inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Serviços */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {servicosFiltrados.map((servico) => (
          <Card key={servico.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{servico.header}</CardTitle>
                  <Badge variant={servico.status === 'Ativo' ? 'default' : 'secondary'}>
                    {servico.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => abrirDialogEdicao(servico)}
                  >
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => abrirModalExclusao(servico)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={modalExclusaoAberto} onOpenChange={setModalExclusaoAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconTrash className="h-5 w-5 text-destructive" />
              {servicoParaExcluir?.status === 'Ativo' ? 'Inativar Serviço' : 'Excluir Serviço Permanentemente'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {servicoParaExcluir?.status === 'Ativo' ? (
                <>
                  <p>Você está prestes a <strong>inativar</strong> o serviço:</p>
                  <p className="font-medium text-foreground">"{servicoParaExcluir?.header}"</p>
                  <p className="text-sm text-muted-foreground">
                    • O serviço será marcado como inativo<br/>
                    • Não aparecerá mais nas listas ativas<br/>
                    • Poderá ser reativado posteriormente<br/>
                    • Histórico de agendamentos será preservado
                  </p>
                </>
              ) : (
                <>
                  <p className="text-destructive font-medium">⚠️ ATENÇÃO: Esta ação é irreversível!</p>
                  <p>Você está prestes a <strong>excluir permanentemente</strong> o serviço:</p>
                  <p className="font-medium text-foreground">"{servicoParaExcluir?.header}"</p>
                  <div className="bg-destructive/10 p-3 rounded-md text-sm">
                    <p className="font-medium text-destructive mb-1">Consequências da exclusão:</p>
                    <ul className="text-destructive/80 space-y-1">
                      <li>• O serviço será removido permanentemente do sistema</li>
                      <li>• Todos os dados relacionados serão perdidos</li>
                      <li>• Agendamentos futuros podem ser afetados</li>
                      <li>• Esta ação NÃO pode ser desfeita</li>
                    </ul>
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={fecharModalExclusao}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarExclusao}
              className={servicoParaExcluir?.status === 'Ativo' 
                ? "bg-orange-600 hover:bg-orange-700" 
                : "bg-destructive hover:bg-destructive/90"
              }
            >
              {servicoParaExcluir?.status === 'Ativo' ? 'Inativar Serviço' : 'Excluir Permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {servico.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {servico.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                  <span>{servico.duration_minutes}min</span>
                </div>
                {servico.target && (
                  <div className="flex items-center gap-1">
                    <IconCurrencyReal className="h-4 w-4 text-muted-foreground" />
                    <span>R$ {servico.target.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                Tipo: {servico.type}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {servicosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <IconSettings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum serviço encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {busca || filtroStatus !== "todos" 
              ? "Tente ajustar os filtros de busca"
              : "Comece adicionando seu primeiro serviço"
            }
          </p>
          {!busca && filtroStatus === "todos" && (
            <Button onClick={abrirDialogNovo}>
              <IconPlus className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Componente do formulário
function FormularioServico({ 
  servico, 
  onSalvar, 
  onCancelar 
}: {
  servico: Service | null
  onSalvar: (dados: any) => void
  onCancelar: () => void
}) {
  const [formData, setFormData] = useState({
    header: servico?.header || '',
    type: servico?.type || 'service',
    status: servico?.status || 'Ativo',
    target: servico?.target?.toString() || '',
    description: servico?.description || '',
    duration_minutes: servico?.duration_minutes?.toString() || '60',
  })

  const [salvando, setSalvando] = useState(false)
  const { products, loading: loadingProdutos } = useProducts()

  type MaterialSelecionado = { product: Product; quantidade: number }
  const [materiais, setMateriais] = useState<MaterialSelecionado[]>([])
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>("")
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState<string>("1")

  const addProduto = () => {
    if (!produtoSelecionado) return
    const prod = products.find(p => p.id === produtoSelecionado)
    if (!prod) return
    const qtd = Math.max(0, parseFloat(quantidadeSelecionada || "0")) || 0

    setMateriais(prev => {
      const idx = prev.findIndex(m => m.product.id === prod.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantidade: next[idx].quantidade + qtd }
        return next
      }
      return [...prev, { product: prod, quantidade: qtd }]
    })
    setProdutoSelecionado("")
    setQuantidadeSelecionada("1")
  }

  const removeProduto = (id: string) => {
    setMateriais(prev => prev.filter(m => m.product.id !== id))
  }

  const updateQuantidadeProduto = (id: string, quantidadeStr: string) => {
    const qtd = Math.max(0, parseFloat(quantidadeStr || "0")) || 0
    setMateriais(prev => prev.map(m => 
      m.product.id === id ? { ...m, quantidade: qtd } : m
    ))
  }

  const custoTotal = materiais.reduce((total, m) => {
    const unitCost = m.product.cost_price ?? 0
    return total + unitCost * m.quantidade
  }, 0)

  const precoServico = parseFloat(formData.target || "0") || 0
  const lucroEstimado = Math.max(0, precoServico - custoTotal)
  const margemEstimadaPct = precoServico > 0 ? (lucroEstimado / precoServico) * 100 : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.header.trim()) {
      toast.error("Nome do serviço é obrigatório")
      return
    }

    setSalvando(true)
    try {
      await onSalvar({
        header: formData.header.trim(),
        type: formData.type,
        status: formData.status as 'Ativo' | 'Inativo',
        target: formData.target ? parseFloat(formData.target) : null,
        description: formData.description.trim() || null,
        duration_minutes: parseInt(formData.duration_minutes) || 60,
        // PERSISTIR MATERIAIS
        materials: materiais.map(m => ({
            product_id: m.product.id,
            quantidade: m.quantidade,
            unit_cost: m.product.cost_price ?? 0,
        })),
      })
    } finally {
      setSalvando(false)
    }
  }

  const { fetchServiceMaterials } = useServices()

  useEffect(() => {
    const preload = async () => {
      if (!servico?.id || products.length === 0) return
      try {
        const rows = await fetchServiceMaterials(servico.id)
        const preenchidos = rows
          .map((row: any) => {
            const prod = products.find(p => p.id === row.product_id)
            if (!prod) return null
            return { product: prod, quantidade: row.quantidade }
          })
          .filter(Boolean) as MaterialSelecionado[]
        setMateriais(preenchidos)
      } catch (err) {
        console.error("Erro ao carregar materiais do serviço:", err)
      }
    }
    preload()
  }, [servico?.id, products])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="header">Nome do Serviço *</Label>
          <Input
            id="header"
            value={formData.header}
            onChange={(e) => setFormData(prev => ({ ...prev, header: e.target.value }))}
            placeholder="Ex: Corte de Cabelo"
            required
          />
        </div>

        <div>
          <Label htmlFor="type">Tipo</Label>
          <Input
            id="type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            placeholder="Ex: Beleza, Consultoria"
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status as 'Ativo' | 'Inativo'}
            onValueChange={(value: 'Ativo' | 'Inativo') => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="duration_minutes">Duração (minutos)</Label>
          <Input
            id="duration_minutes"
            type="number"
            min="1"
            value={formData.duration_minutes}
            onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
            placeholder="60"
          />
        </div>

        <div>
          <Label htmlFor="target">Preço (R$)</Label>
          <Input
            id="target"
            type="number"
            step="0.01"
            min="0"
            value={formData.target}
            onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
            placeholder="0.00"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descreva o serviço oferecido..."
            rows={3}
          />
        </div>
      </div>

      {/* Produtos utilizados */}
      <div className="space-y-3">
        <Label>Produtos utilizados</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={produtoSelecionado}
            onValueChange={setProdutoSelecionado}
            disabled={loadingProdutos}
          >
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder={loadingProdutos ? "Carregando produtos..." : "Selecione um produto"} />
            </SelectTrigger>
            <SelectContent>
              {products.length === 0 ? (
                <SelectItem value="__empty" disabled>Nenhum produto cadastrado</SelectItem>
              ) : (
                products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome} • Estoque: {p.quantidade} • Custo: R$ {(p.cost_price ?? 0).toFixed(2)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Input
            type="number"
            min="0"
            step="0.01"
            value={quantidadeSelecionada}
            onChange={(e) => setQuantidadeSelecionada(e.target.value)}
            placeholder="Quantidade"
            className="w-full sm:w-[140px]"
          />

          <Button
            type="button"
            onClick={addProduto}
            disabled={!produtoSelecionado || parseFloat(quantidadeSelecionada || "0") <= 0}
            className="w-full sm:w-auto"
          >
            <IconPlus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {loadingProdutos ? (
          <div className="flex items-center gap-2 text-primary">
            <IconLoader2 className="h-4 w-4 animate-spin" />
            Carregando produtos...
          </div>
        ) : (
          materiais.length > 0 && (
            <div className="space-y-2">
              {materiais.map((m) => {
                const unitCost = m.product.cost_price ?? 0
                const total = unitCost * m.quantidade
                const estoqueInsuficiente = (m.product.quantidade ?? 0) < m.quantidade
                return (
                  <div key={m.product.id} className="flex items-center justify-between rounded-md border p-2">
                    <div>
                      <div className="font-medium">{m.product.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        Custo unitário: R$ {unitCost.toFixed(2)} • Total: R$ {total.toFixed(2)} • Estoque: {m.product.quantidade}
                        {estoqueInsuficiente && (
                          <span className="text-destructive ml-2">Estoque insuficiente</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={m.quantidade}
                        onChange={(e) => updateQuantidadeProduto(m.product.id, e.target.value)}
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeProduto(m.product.id)}
                        title="Remover"
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}

              <div className="border-t pt-2 text-sm">
                <div className="flex justify-between">
                  <span>Custo total</span>
                  <span>R$ {custoTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lucro estimado</span>
                  <span>R$ {lucroEstimado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Margem estimada</span>
                  <span>{margemEstimadaPct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          {servico ? 'Atualizar' : 'Criar'} Serviço
        </Button>
      </div>
    </form>
  )
}