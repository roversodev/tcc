"use client"

import { useEffect, useMemo, useState } from "react"
import { format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select"
import { useEvents } from "@/hooks/use-events"
import { useProducts } from "@/hooks/use-products"
import { useServices } from "@/hooks/use-services"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type MaterialItem = {
  id: string
  product_id: string
  quantidade: number
  unit_cost: number
  products?: {
    id: string
    nome: string
    unidade: string
    quantidade: number
    cost_price: number
  }
}

export default function AgendaHojePage() {
  const supabase = createClient()
  const {
    events,
    clients,
    services,
    loading,
    fetchEvents,
    updateEventStatus,
  } = useEvents()
  const { createMovement, products } = useProducts()
  const { fetchServiceMaterials } = useServices()

  const [finalizarOpen, setFinalizarOpen] = useState(false)
  const [eventoSelecionado, setEventoSelecionado] = useState<any | null>(null)
  const [materiais, setMateriais] = useState<MaterialItem[]>([])
  const [valorServico, setValorServico] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [eventoParaCancelar, setEventoParaCancelar] = useState<any | null>(null)
  const [canceling, setCanceling] = useState(false)
  const [extraProdId, setExtraProdId] = useState<string>("")
  const [extraQtd, setExtraQtd] = useState<string>("")
  const [extras, setExtras] = useState<{ product_id: string; quantidade: number }[]>([])
  const [desconto, setDesconto] = useState<number>(0)
  const [startOpen, setStartOpen] = useState(false)
  const [eventoParaIniciar, setEventoParaIniciar] = useState<any | null>(null)
  const [starting, setStarting] = useState(false)

  // Helper moeda (pt-BR)
  const formatBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n || 0))

  // Cálculos para o resumo (memoizados)
  const valorLiquidoVisivel = useMemo(() => {
    const v = parseLocaleNumber(valorServico)
    const d = parseLocaleNumber(desconto)
    return Math.max(0, Number(v) - Number(d))
  }, [valorServico, desconto])

  const custoTotalMateriaisVisivel = useMemo(() => {
    return materiais.reduce((sum, m) => {
      const qtd = parseLocaleNumber(m.quantidade)
      const custoMedio = Number(m.products?.cost_price ?? 0)
      return sum + (qtd > 0 ? qtd * custoMedio : 0)
    }, 0)
  }, [materiais])

  const lucroBrutoVisivel = useMemo(() => {
    return Number(valorLiquidoVisivel) - Number(custoTotalMateriaisVisivel)
  }, [valorLiquidoVisivel, custoTotalMateriaisVisivel])
  const hoje = new Date()
  const eventosHoje = useMemo(() => {
    return (events || []).filter((ev: any) => {
      const d = new Date(ev.start_date)
      return isSameDay(d, hoje)
    })
  }, [events])

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleIniciar = async (ev: any) => {
    try {
      await updateEventStatus(ev.id, "confirmed")
      toast.success("Atendimento iniciado", {
        description: `${ev.clients?.nome || "Cliente"} • ${ev.services?.header || "Serviço"}`
      })
    } catch (e) {
      console.error(e)
      toast.error("Não foi possível iniciar o atendimento")
    }
  }

  // NOVO: abrir modal de iniciar
  const abrirIniciar = (ev: any) => {
    setEventoParaIniciar(ev)
    setStartOpen(true)
  }

  // NOVO: confirmar início (chama handleIniciar)
  const confirmarInicio = async () => {
    if (!eventoParaIniciar) return
    setStarting(true)
    try {
      await handleIniciar(eventoParaIniciar)
      setStartOpen(false)
      setEventoParaIniciar(null)
    } finally {
      setStarting(false)
    }
  }

  const abrirFinalizar = async (ev: any) => {
    setErro(null)
    setEventoSelecionado(ev)
    setFinalizarOpen(true)
    setMateriais([])
    setValorServico(0)

    try {
      const serviceId = ev.service_id
      const service = services.find(s => s.id === serviceId)
      setValorServico(Number(service?.target ?? 0))

      if (serviceId) {
        const rows = await fetchServiceMaterials(serviceId)
        setMateriais(rows || [])
      }
    } catch (e) {
      console.error("Erro ao carregar materiais:", e)
      setErro("Não foi possível carregar os materiais do serviço.")
      toast.error("Erro ao carregar materiais do serviço")
    }
  }

  // NOVO: abre modal de confirmação de cancelamento
  const abrirCancelar = (ev: any) => {
    setEventoParaCancelar(ev)
    setCancelOpen(true)
  }

  // NOVO: confirma cancelamento
  const confirmarCancelamento = async () => {
    if (!eventoParaCancelar) return
    setCanceling(true)
    try {
      await updateEventStatus(eventoParaCancelar.id, "cancelled")
      setCancelOpen(false)
      setEventoParaCancelar(null)
      toast.success("Atendimento cancelado", {
        description: `${eventoParaCancelar.clients?.nome || "Cliente"} • ${eventoParaCancelar.services?.header || "Serviço"}`
      })
    } catch (e) {
      console.error(e)
      toast.error("Não foi possível cancelar o atendimento")
    } finally {
      setCanceling(false)
    }
  }

  const handleCancelar = async (ev: any) => {
    try {
      await updateEventStatus(ev.id, "cancelled")
    } catch (e) {
      console.error(e)
    }
  }

  // Helper para aceitar "0,1" como 0.1
  // Aceita números com vírgula e espaços
  function parseLocaleNumber(value: string | number): number {
    if (typeof value === "number") return value
    if (!value) return 0
    const normalized = value.replace(/\s+/g, "").replace(",", ".")
    const n = Number(normalized)
    return isNaN(n) ? 0 : n
  }

  // CORREÇÃO: função ausente
  const atualizarQuantidadeMaterial = (index: number, novaQtdStr: string | number) => {
    const novaQtd = parseLocaleNumber(novaQtdStr)
    setMateriais(prev => {
      const arr = [...prev]
      arr[index] = { ...arr[index], quantidade: novaQtd }
      return arr
    })
  }

  // Adicionar item extra
  const adicionarItemExtra = () => {
    const pid = extraProdId
    const qtd = parseLocaleNumber(extraQtd)
    if (!pid || !qtd || qtd <= 0) return
    setExtras(prev => [...prev, { product_id: pid, quantidade: qtd }])
    setExtraProdId("")
    setExtraQtd("")
  }

  const concluirAtendimento = async () => {
    if (!eventoSelecionado) return
    setSaving(true)
    setErro(null)

    try {
      // 1) Baixa de estoque (saídas) para cada material
      for (const m of materiais) {
        const qtd = parseLocaleNumber(m.quantidade)
        if (m.product_id && qtd && qtd > 0) {
          await createMovement({
            product_id: m.product_id,
            type: "saida",
            quantidade: qtd,
            note: `Consumo no evento ${eventoSelecionado.title || ""}`,
          })
        }
      }

      // 1.1) Baixa de estoque dos itens extras
      for (const ex of extras) {
        const qtd = parseLocaleNumber(ex.quantidade)
        if (ex.product_id && qtd && qtd > 0) {
          await createMovement({
            product_id: ex.product_id,
            type: "saida",
            quantidade: qtd,
            note: `Item extra no evento ${eventoSelecionado.title || ""}`,
          })
        }
      }

      // 2) Registrar faturamento (líquido de desconto)
      const valor = parseLocaleNumber(valorServico)
      const desc = parseLocaleNumber(desconto)
      const valorLiquido = Math.max(0, Number(valor) - Number(desc))

      if (valorLiquido && valorLiquido > 0) {
        const payload = {
          company_id: eventoSelecionado.company_id,
          created_by: eventoSelecionado.created_by,
          client_id: eventoSelecionado.client_id || null,
          event_id: eventoSelecionado.id,
          type: "faturamento" as const,
          amount: Number(valorLiquido),
          description: `Faturamento do evento: ${eventoSelecionado.services?.header || eventoSelecionado.title || ""}`,
          date: new Date().toISOString().slice(0, 10),
          category: "Serviço",
        }
        const { error: finErr } = await supabase
          .from("financial_movements")
          .insert(payload)
        if (finErr) throw finErr
      }

      // 3) Registrar DESPESA dos materiais consumidos (para dashboard)
      const custoTotalMateriais = materiais.reduce((sum, m) => {
        const qtd = parseLocaleNumber(m.quantidade)
        const custoMedio = Number(m.products?.cost_price ?? 0)
        return sum + (qtd > 0 ? qtd * custoMedio : 0)
      }, 0)

      if (custoTotalMateriais > 0) {
        const { error: costErr } = await supabase
          .from("financial_movements")
          .insert({
            company_id: eventoSelecionado.company_id,
            created_by: eventoSelecionado.created_by,
            client_id: eventoSelecionado.client_id || null,
            event_id: eventoSelecionado.id,
            type: "despesa",
            amount: Number(custoTotalMateriais.toFixed(2)),
            description: `Custo de materiais do evento: ${eventoSelecionado.services?.header || eventoSelecionado.title || ""}`,
            date: new Date().toISOString().slice(0, 10),
            category: "Custo de materiais",
          })
        if (costErr) throw costErr
      }

      // 4) Atualizar total_gasto do cliente (se disponível)
      if (eventoSelecionado.client_id) {
        const cliente = clients.find(c => c.id === eventoSelecionado.client_id)
        if (cliente) {
          const novoTotal = Number(cliente.total_gasto || 0) + Number(valor || 0)
          const { error: cliErr } = await supabase
            .from("clients")
            .update({
              total_gasto: novoTotal,
              ultimo_atendimento: new Date().toISOString(),
            })
            .eq("id", cliente.id)
            .eq("company_id", cliente.company_id)
          if (cliErr) console.warn("Falha ao atualizar total_gasto do cliente:", cliErr.message)
        }
      }

      // 5) Marcar evento como concluído
      await updateEventStatus(eventoSelecionado.id, "completed")

      setFinalizarOpen(false)
      setEventoSelecionado(null)
      setMateriais([])
      setValorServico(0)
      setExtras([])
      setDesconto(0)

      toast.success("Atendimento concluído", {
        description: `Faturamento: ${formatBRL(valorLiquidoVisivel)}`
      })
    } catch (e: any) {
      console.error("Erro ao concluir atendimento:", e)
      setErro(e?.message || "Erro ao concluir atendimento")
      toast.error("Erro ao concluir atendimento")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-4">
      {/* Cabeçalho minimalista */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Agenda de Hoje</h1>
        <div className="text-sm text-muted-foreground">
          {format(hoje, "dd 'de' MMMM, yyyy", { locale: ptBR })}
        </div>
      </div>

      {/* Lista de eventos */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando agendamentos...</div>
      ) : eventosHoje.length === 0 ? (
        <div className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Horário</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventosHoje.map((ev: any) => {
              const clienteNome = ev.clients?.nome || ev.cliente || "—"
              const servicoNome = ev.services?.header || "—"
              const status = ev.status
              const start = new Date(ev.start_date)
              return (
                <TableRow key={ev.id}>
                  <TableCell>{format(start, "HH:mm")}</TableCell>
                  <TableCell>{clienteNome}</TableCell>
                  <TableCell>{servicoNome}</TableCell>
                  <TableCell>
                    <Badge variant={
                      status === "scheduled" ? "secondary" :
                        status === "confirmed" ? "default" :
                          status === "completed" ? "success" :
                            "destructive"
                    }>
                      {status === "scheduled" && "Agendado"}
                      {status === "confirmed" && "Em andamento"}
                      {status === "completed" && "Concluído"}
                      {status === "cancelled" && "Cancelado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {status === "scheduled" && (
                      <Button size="sm" onClick={() => abrirIniciar(ev)}>
                        Iniciar
                      </Button>
                    )}
                    {status === "confirmed" && (
                      <Button size="sm" variant="default" onClick={() => abrirFinalizar(ev)}>
                        Concluir (Pago)
                      </Button>
                    )}
                    {status !== "completed" && (
                      <Button size="sm" variant="destructive" onClick={() => abrirCancelar(ev)}>
                        Cancelar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {/* Modal de conclusão (já existente) */}
      <Dialog open={finalizarOpen} onOpenChange={setFinalizarOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Finalizar Atendimento</DialogTitle>
          </DialogHeader>

          {erro && <div className="text-sm text-red-600">{erro}</div>}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente</Label>
                <div className="text-sm">
                  {eventoSelecionado?.clients?.nome || eventoSelecionado?.cliente || "—"}
                </div>
              </div>
              <div>
                <Label>Serviço</Label>
                <div className="text-sm">{eventoSelecionado?.services?.header || "—"}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Materiais utilizados (estoque)</Label>
              <div className="space-y-2">
                {materiais.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum material cadastrado para este serviço.</div>
                ) : (
                  materiais.map((m, idx) => (
                    <div key={m.id} className="grid grid-cols-5 items-center gap-2">
                      <div className="col-span-3">
                        <div className="text-sm">{m.products?.nome || m.product_id}</div>
                        <div className="text-xs text-muted-foreground">
                          Em estoque: {m.products?.quantidade ?? 0} {m.products?.unidade ?? "un"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Qtd</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={String(m.quantidade)}
                          onChange={(e) => atualizarQuantidadeMaterial(idx, e.target.value)}
                        />
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        Custo médio: {Number(m.products?.cost_price ?? 0).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* NOVO: Itens extras (opcional) */}
            <div className="space-y-2">
              <Label>Itens extras (opcional)</Label>
              <div className="grid grid-cols-5 items-end gap-2">
                <div className="col-span-3">
                  <Select value={extraProdId} onValueChange={setExtraProdId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome} — estoque: {p.quantidade} {p.unidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Qtd</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={extraQtd}
                    onChange={(e) => setExtraQtd(e.target.value)}
                  />
                </div>
                <div className="text-right">
                  <Button type="button" onClick={adicionarItemExtra}>Adicionar</Button>
                </div>
              </div>

              {/* Lista de extras adicionados */}
              {extras.length > 0 && (
                <div className="space-y-1">
                  {extras.map((ex, i) => {
                    const prod = products.find(p => p.id === ex.product_id)
                    return (
                      <div key={`${ex.product_id}-${i}`} className="text-sm">
                        {prod?.nome || ex.product_id} — {ex.quantidade} {prod?.unidade || "un"} (custo médio: {Number(prod?.cost_price ?? 0).toFixed(2)})
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* NOVO: Desconto */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor do serviço (R$)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={String(valorServico)}
                  onChange={(e) => setValorServico(parseLocaleNumber(e.target.value))}
                />
              </div>
              <div>
                <Label>Desconto (R$)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={String(desconto)}
                  onChange={(e) => setDesconto(parseLocaleNumber(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Resumo estilo “Informações Calculadas” */}
          <div className="mt-4 rounded-lg border bg-muted/50 p-4">
            <div className="mb-3 text-base font-semibold">Informações Calculadas</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Faturamento líquido */}
              <div>
                <div className="text-sm text-muted-foreground">Faturamento Líquido:</div>
                <div className="text-emerald-600 font-medium">
                  {formatBRL(valorLiquidoVisivel)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Desconto aplicado: {formatBRL(parseLocaleNumber(desconto))}
                </div>
              </div>

              {/* Status da operação */}
              <div>
                <div className="text-sm text-muted-foreground">Status:</div>
                <div
                  className={
                    lucroBrutoVisivel > 0
                      ? "text-emerald-600 font-medium"
                      : lucroBrutoVisivel === 0
                        ? "text-muted-foreground font-medium"
                        : "text-red-600 font-medium"
                  }
                >
                  {lucroBrutoVisivel > 0
                    ? "Operação Rentável"
                    : lucroBrutoVisivel === 0
                      ? "Empate"
                      : "Prejuízo"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Custo materiais: {formatBRL(custoTotalMateriaisVisivel)}
                </div>
              </div>

              {/* Lucro bruto estimado */}
              <div>
                <div className="text-sm text-muted-foreground">Lucro Bruto Estimado:</div>
                <div
                  className={
                    lucroBrutoVisivel >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"
                  }
                >
                  {formatBRL(lucroBrutoVisivel)}
                </div>
                {eventoSelecionado?.client_id && (
                  <div className="text-xs text-muted-foreground">
                    Cliente +{formatBRL(parseLocaleNumber(valorServico))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizarOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={concluirAtendimento} disabled={saving}>
              {saving ? "Salvando..." : "Confirmar conclusão"}
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>


      {/* NOVO: Modal de confirmação de cancelamento */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar cancelamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="text-muted-foreground">
              Tem certeza que deseja cancelar este atendimento?
            </div>
            {eventoParaCancelar && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>{" "}
                  {eventoParaCancelar.clients?.nome || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Serviço:</span>{" "}
                  {eventoParaCancelar.services?.header || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Horário:</span>{" "}
                  {format(new Date(eventoParaCancelar.start_date), "HH:mm")}
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Esta ação é definitiva e marcará o evento como cancelado.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={canceling}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={confirmarCancelamento} disabled={canceling}>
              {canceling ? "Cancelando..." : "Confirmar cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* NOVO: Modal de confirmação de início */}
      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar início do atendimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="text-muted-foreground">
              Deseja iniciar este atendimento agora?
            </div>
            {eventoParaIniciar && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>{" "}
                  {eventoParaIniciar.clients?.nome || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Serviço:</span>{" "}
                  {eventoParaIniciar.services?.header || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Horário:</span>{" "}
                  {format(new Date(eventoParaIniciar.start_date), "HH:mm")}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)} disabled={starting}>
              Voltar
            </Button>
            <Button onClick={confirmarInicio} disabled={starting}>
              {starting ? "Iniciando..." : "Confirmar início"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}