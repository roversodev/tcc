"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPlus, IconSearch, IconPhone, IconMail, IconMapPin, IconEdit, IconTrash, IconUser, IconCalendar, IconCreditCard } from "@tabler/icons-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  endereco: string
  dataNascimento: string
  categoria: "VIP" | "Regular" | "Novo"
  ultimoAtendimento: string
  totalGasto: number
  observacoes: string
  avatar?: string
}

const clientesIniciais: Cliente[] = [
  {
    id: "1",
    nome: "Maria Silva Santos",
    email: "maria.santos@email.com",
    telefone: "(11) 99999-1234",
    endereco: "Rua das Flores, 123 - Centro",
    dataNascimento: "1985-03-15",
    categoria: "VIP",
    ultimoAtendimento: "2024-01-15",
    totalGasto: 1250.00,
    observacoes: "Cliente preferencial, gosta de cortes modernos"
  },
  {
    id: "2",
    nome: "João Carlos Oliveira",
    email: "joao.oliveira@email.com",
    telefone: "(11) 98888-5678",
    endereco: "Av. Principal, 456 - Jardim América",
    dataNascimento: "1990-07-22",
    categoria: "Regular",
    ultimoAtendimento: "2024-01-10",
    totalGasto: 680.00,
    observacoes: "Sempre pontual, prefere horários pela manhã"
  },
  {
    id: "3",
    nome: "Ana Paula Costa",
    email: "ana.costa@email.com",
    telefone: "(11) 97777-9012",
    endereco: "Rua do Comércio, 789 - Vila Nova",
    dataNascimento: "1988-11-08",
    categoria: "VIP",
    ultimoAtendimento: "2024-01-12",
    totalGasto: 2100.00,
    observacoes: "Nutricionista, sempre agenda consultas mensais"
  },
  {
    id: "4",
    nome: "Pedro Lima Ferreira",
    email: "pedro.lima@email.com",
    telefone: "(11) 96666-3456",
    endereco: "Rua da Paz, 321 - Bela Vista",
    dataNascimento: "1992-05-30",
    categoria: "Regular",
    ultimoAtendimento: "2024-01-08",
    totalGasto: 420.00,
    observacoes: "Massagista, cliente há 2 anos"
  },
  {
    id: "5",
    nome: "Carla Rodrigues",
    email: "carla.rodrigues@email.com",
    telefone: "(11) 95555-7890",
    endereco: "Av. das Palmeiras, 654 - Jardim Paulista",
    dataNascimento: "1995-12-03",
    categoria: "Novo",
    ultimoAtendimento: "2024-01-05",
    totalGasto: 150.00,
    observacoes: "Primeira vez no salão, indicada por Maria Silva"
  }
]

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais)
  const [busca, setBusca] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos")
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)

  const clientesFiltrados = clientes.filter(cliente => {
    const matchBusca = cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      cliente.email.toLowerCase().includes(busca.toLowerCase()) ||
                      cliente.telefone.includes(busca)
    
    const matchCategoria = filtroCategoria === "todos" || cliente.categoria === filtroCategoria
    
    return matchBusca && matchCategoria
  })

  const abrirDialogCliente = (cliente?: Cliente) => {
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {modoEdicao ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {modoEdicao ? "Atualize as informações do cliente" : "Adicione um novo cliente ao seu cadastro"}
              </DialogDescription>
            </DialogHeader>
            <FormularioCliente cliente={clienteSelecionado} onClose={() => setDialogAberto(false)} />
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
            <div className="text-2xl font-bold">{clientes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes VIP</CardTitle>
            <IconUser className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.filter(c => c.categoria === "VIP").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <IconUser className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.filter(c => c.categoria === "Novo").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <IconCreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {clientes.reduce((acc, c) => acc + c.totalGasto, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  <AvatarImage src={cliente.avatar} />
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
                <div className="flex items-center text-muted-foreground">
                  <IconMail className="mr-2 h-4 w-4" />
                  <span className="truncate">{cliente.email}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <IconPhone className="mr-2 h-4 w-4" />
                  <span>{cliente.telefone}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <IconMapPin className="mr-2 h-4 w-4" />
                  <span className="truncate">{cliente.endereco}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <IconCalendar className="mr-2 h-4 w-4" />
                  <span>
                    Último atendimento: {format(new Date(cliente.ultimoAtendimento), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total gasto:</span>
                  <span className="font-semibold text-green-600">
                    R$ {cliente.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

// Componente do formulário (será implementado na próxima etapa)
function FormularioCliente({ cliente, onClose }: { cliente: Cliente | null, onClose: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">Formulário em desenvolvimento...</p>
      <Button onClick={onClose}>Fechar</Button>
    </div>
  )
}