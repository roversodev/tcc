"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IconPlus, IconSearch, IconPhone, IconMail, IconMapPin, IconEdit, IconUser, IconCalendar, IconCreditCard, IconLoader2, IconAlertTriangle } from "@tabler/icons-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useClients } from "@/hooks/use-clients"
import { Client } from "@/lib/database.types"
import { toast } from "sonner"

export default function ClientesPage() {
  const { 
    clients, 
    loading, 
    error,
    clientsStats,
    createClient,
    updateClient,
    deleteClient
  } = useClients()

  const [busca, setBusca] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos")
  const [clienteSelecionado, setClienteSelecionado] = useState<Client | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)

  const clientesFiltrados = clients.filter(cliente => {
    const matchBusca = cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      (cliente.email || '').toLowerCase().includes(busca.toLowerCase()) ||
                      (cliente.telefone || '').includes(busca)
    
    const matchCategoria = filtroCategoria === "todos" || cliente.categoria === filtroCategoria
    
    return matchBusca && matchCategoria
  })

  const abrirDialogCliente = (cliente?: Client) => {
    if (cliente) {
      setClienteSelecionado(cliente)
      setModoEdicao(true)
    } else {
      setClienteSelecionado(null)
      setModoEdicao(false)
    }
    setDialogAberto(true)
  }

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case "VIP": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Regular": return "bg-blue-100 text-blue-800 border-blue-200"
      case "Novo": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <IconLoader2 className="h-6 w-6 animate-spin" />
          <span>Carregando clientes...</span>
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
            Erro ao carregar clientes: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e mantenha um relacionamento próximo
          </p>
        </div>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button onClick={() => abrirDialogCliente()}>
              <IconPlus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {modoEdicao ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {modoEdicao ? "Atualize as informações do cliente" : "Adicione um novo cliente ao seu cadastro"}
              </DialogDescription>
            </DialogHeader>
            <FormularioCliente 
              cliente={clienteSelecionado} 
              onClose={() => setDialogAberto(false)}
              onSave={async (data) => {
                try {
                  if (modoEdicao && clienteSelecionado) {
                    await updateClient(clienteSelecionado.id, data)
                    toast.success("Cliente atualizado com sucesso!")
                  } else {
                    await createClient(data)
                    toast.success("Cliente criado com sucesso!")
                  }
                  setDialogAberto(false)
                } catch (error) {
                  toast.error("Erro ao salvar cliente")
                  console.error(error)
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as categorias</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
            <SelectItem value="Regular">Regular</SelectItem>
            <SelectItem value="Novo">Novo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes VIP</CardTitle>
            <IconUser className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsStats.vip}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <IconUser className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsStats.novo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <IconCreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {clientsStats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Clientes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clientesFiltrados.map((cliente) => (
          <Card key={cliente.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={cliente.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(cliente.nome)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{cliente.nome}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getCategoriaColor(cliente.categoria)}>
                      {cliente.categoria}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                {cliente.email && (
                  <div className="flex items-center text-muted-foreground">
                    <IconMail className="mr-2 h-4 w-4" />
                    <span className="truncate">{cliente.email}</span>
                  </div>
                )}
                {cliente.telefone && (
                  <div className="flex items-center text-muted-foreground">
                    <IconPhone className="mr-2 h-4 w-4" />
                    <span>{cliente.telefone}</span>
                  </div>
                )}
                {cliente.endereco && (
                  <div className="flex items-center text-muted-foreground">
                    <IconMapPin className="mr-2 h-4 w-4" />
                    <span className="truncate">{cliente.endereco}</span>
                  </div>
                )}
                {cliente.ultimo_atendimento && (
                  <div className="flex items-center text-muted-foreground">
                    <IconCalendar className="mr-2 h-4 w-4" />
                    <span>
                      Último atendimento: {format(new Date(cliente.ultimo_atendimento), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total gasto:</span>
                  <span className="font-semibold text-green-600">
                    R$ {cliente.total_gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => abrirDialogCliente(cliente)}
                >
                  <IconEdit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <IconCalendar className="mr-2 h-4 w-4" />
                  Agendar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clientesFiltrados.length === 0 && (
        <div className="text-center py-12">
          <IconUser className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground">
            {busca || filtroCategoria !== "todos" 
              ? "Tente ajustar os filtros de busca" 
              : "Comece adicionando seu primeiro cliente"}
          </p>
        </div>
      )}
    </div>
  )
}

// Função para aplicar máscara de telefone
const formatPhoneNumber = (value: string) => {
  // Remove tudo que não é dígito
  const cleanValue = value.replace(/\D/g, '')
  
  // Aplica a máscara baseada no tamanho
  if (cleanValue.length <= 10) {
    // Telefone fixo: (11) 1234-5678
    return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  } else {
    // Celular: (11) 91234-5678
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
}

// Componente do formulário
function FormularioCliente({ 
  cliente, 
  onClose, 
  onSave 
}: { 
  cliente: Client | null
  onClose: () => void
  onSave: (data: any) => Promise<void>
}) {
  const [formData, setFormData] = useState({
    nome: cliente?.nome || "",
    email: cliente?.email || "",
    telefone: cliente?.telefone || "",
    endereco: cliente?.endereco || "",
    data_nascimento: cliente?.data_nascimento || "",
    categoria: cliente?.categoria || "Novo" as const,
    observacoes: cliente?.observacoes || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData(prev => ({ ...prev, telefone: formatted }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome *</label>
          <Input
            value={formData.nome}
            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            placeholder="Nome completo do cliente"
            className={errors.nome ? "border-red-500" : ""}
          />
          {errors.nome && <p className="text-sm text-red-500">{errors.nome}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="email@exemplo.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Telefone</label>
          <Input
            value={formData.telefone}
            onChange={handlePhoneChange}
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Data de Nascimento</label>
          <Input
            type="date"
            value={formData.data_nascimento}
            onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Categoria</label>
          <Select 
            value={formData.categoria} 
            onValueChange={(value: "VIP" | "Regular" | "Novo") => 
              setFormData(prev => ({ ...prev, categoria: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Novo">Novo</SelectItem>
              <SelectItem value="Regular">Regular</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Endereço</label>
        <Input
          value={formData.endereco}
          onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
          placeholder="Endereço completo"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Observações</label>
        <textarea
          className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
          value={formData.observacoes}
          onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
          placeholder="Observações sobre o cliente..."
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            cliente ? "Atualizar" : "Criar Cliente"
          )}
        </Button>
      </div>
    </form>
  )
}