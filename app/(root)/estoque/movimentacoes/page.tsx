"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts"
import { IconLoader2, IconPlus } from "@tabler/icons-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useProducts } from "@/hooks/use-products"
import { Product } from "@/lib/database.types"
import { toast } from "sonner"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeSheet } from "@/components/upgrade-sheet"
import { canAccess } from "@/lib/plan"

export default function MovimentacoesEstoquePage() {
    const {
        products,
        movements,
        movementsLoading,
        fetchMovements,
        createMovement,
    } = useProducts()

     const { plan, loading: planLoading } = usePlan()

      if (!canAccess(plan, 'movimentacoes')) {
      return (
        <div className="flex-1 p-6">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Funcionalidade disponível no plano Plus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                As movimentações de estoque estão disponíveis a partir do plano Plus.
              </p>
              <UpgradeSheet />
            </CardContent>
          </Card>
        </div>
      )
    }

    const [dialogMovimento, setDialogMovimento] = useState(false)
    const [produtoSelecionado, setProdutoSelecionado] = useState<Product | null>(null)

    useEffect(() => {
        fetchMovements()
    }, [])

    const abrirDialogMovimento = (produto?: Product) => {
        setProdutoSelecionado(produto || null)
        setDialogMovimento(true)
    }

    const dadosGrafico = useMemo(() => {
        const map = new Map<string, { entrada: number; saida: number }>()
        movements.forEach(m => {
            const d = new Date(m.created_at)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            const agg = map.get(key) || { entrada: 0, saida: 0 }
            if (m.type === 'entrada') agg.entrada += m.quantidade
            else agg.saida += m.quantidade
            map.set(key, agg)
        })
        return Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, v]) => ({ date, ...v }))
    }, [movements])

    return (
        <div className="flex-1 space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Movimentações de Estoque</h1>
                    <p className="text-muted-foreground">
                        Histórico de entradas e saídas com gráfico por dia
                    </p>
                </div>
                <Button onClick={() => abrirDialogMovimento()}>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Nova Movimentação
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tabela de Movimentações</CardTitle>
                </CardHeader>
                <CardContent>
                    {movementsLoading ? (
                        <div className="flex items-center gap-2 py-6">
                            <IconLoader2 className="h-5 w-5 animate-spin" />
                            <span>Carregando movimentações...</span>
                        </div>
                    ) : (
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Produto</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Quantidade</TableHead>
                                        <TableHead>Preço de Custo</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Observação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movements.map((m) => {
                                        const produtoNome = (m as any).products?.nome ?? '—'
                                        const unidade = (m as any).products?.unidade ?? ''
                                        const total = (m.unit_cost ?? 0) * m.quantidade
                                        return (
                                            <TableRow key={m.id}>
                                                <TableCell>{format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                                                <TableCell>{produtoNome}</TableCell>
                                                <TableCell className={m.type === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                                                    {m.type === 'entrada' ? 'Entrada' : 'Saída'}
                                                </TableCell>
                                                <TableCell>{m.quantidade} {unidade}</TableCell>
                                                <TableCell>R$ {(m.unit_cost ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                                <TableCell>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                                <TableCell className="max-w-[280px] truncate">{m.note ?? '—'}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Entradas x Saídas por dia</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        id="movimentos-dia"
                        config={{
                            entrada: { label: "Entradas" },
                            saida: { label: "Saídas" },
                        }}
                    >
                        <div className="h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dadosGrafico}>
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar dataKey="entrada" fill="#22c55e" />
                                    <Bar dataKey="saida" fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Dialog de movimentação */}
            <Dialog open={dialogMovimento} onOpenChange={setDialogMovimento}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Movimentação</DialogTitle>
                        <DialogDescription>
                            Registre uma entrada (compra) ou saída (vencimento, perda, uso).
                        </DialogDescription>
                    </DialogHeader>
                    <DialogMovimento
                        produto={produtoSelecionado}
                        products={products}
                        onClose={() => setDialogMovimento(false)}
                        onSave={async (args) => {
                            try {
                                await createMovement(args)
                                await fetchMovements()
                                toast.success("Movimentação registrada com sucesso!")
                                setDialogMovimento(false)
                            } catch (error) {
                                toast.error("Erro ao registrar movimentação")
                                console.error(error)
                            }
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}

function DialogMovimento({
    produto,
    products,
    onClose,
    onSave
}: {
    produto: Product | null
    products: Product[]
    onClose: () => void
    onSave: (args: { product_id: string; type: 'entrada' | 'saida'; quantidade: number; unit_cost?: number | null; note?: string }) => Promise<void>
}) {
    const [selectedProductId, setSelectedProductId] = useState(produto?.id || "")
    const [type, setType] = useState<'entrada' | 'saida'>('entrada')
    const [quantidade, setQuantidade] = useState<number>(0)
    const [unitCost, setUnitCost] = useState<number | null>(null)
    const [reason, setReason] = useState<string>('compra')
    const [note, setNote] = useState<string>("")
    const [loading, setLoading] = useState(false)

    const selected = products.find(p => p.id === selectedProductId) || null
    const currentQty = selected?.quantidade ?? 0
    const currentCost = selected?.cost_price ?? 0

    const previewQty = type === 'entrada' ? currentQty + quantidade : Math.max(0, currentQty - quantidade)
    const previewCost = type === 'entrada'
        ? (() => {
            const inc = Number(unitCost ?? 0)
            const total = currentQty + quantidade
            return total > 0 ? ((currentQty * currentCost) + (quantidade * inc)) / total : inc
        })()
        : currentCost

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProductId) {
            toast.error("Selecione um produto")
            return
        }
        if (!quantidade || quantidade <= 0) {
            toast.error("Informe uma quantidade válida")
            return
        }
        if (type === 'saida' && quantidade > currentQty) {
            toast.error("Saída maior que o estoque atual")
            return
        }
        if (type === 'entrada' && (!unitCost || unitCost <= 0)) {
            toast.error("Preço de custo é obrigatório para entrada")
            return
        }

        try {
            setLoading(true)
            const noteText = reason ? `${reason}${note ? ' - ' + note : ''}` : note
            await onSave({
                product_id: selectedProductId,
                type,
                quantidade,
                unit_cost: type === 'entrada' ? Number(unitCost) : null,
                note: noteText
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                        {products.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.nome} — {p.quantidade} {p.unidade}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={type} onValueChange={(v) => setType(v as 'entrada' | 'saida')}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="entrada">Entrada</SelectItem>
                            <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                        type="number"
                        min={1}
                        value={quantidade}
                        onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
                        placeholder="Ex: 5"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Preço de Custo (R$)</Label>
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitCost ?? ""}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || null)}
                    placeholder="Ex: 12,90"
                    disabled={type === 'saida'}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Motivo</Label>
                    <Select value={reason} onValueChange={setReason}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="compra">Compra</SelectItem>
                            <SelectItem value="vencimento">Vencimento</SelectItem>
                            <SelectItem value="perda">Perda</SelectItem>
                            <SelectItem value="ajuste">Ajuste</SelectItem>
                            <SelectItem value="uso">Uso</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Observação</Label>
                    <Input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Detalhes da movimentação (opcional)"
                    />
                </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-md text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Estoque atual</span>
                    <span className="font-medium">{currentQty} {selected?.unidade || ''}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Após movimentação</span>
                    <span className="font-medium">{previewQty} {selected?.unidade || ''}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo médio atual</span>
                    <span className="font-medium">
                        R$ {currentCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo médio após</span>
                    <span className="font-medium">
                        R$ {previewCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar Movimentação
                </Button>
            </div>
        </form>
    )
}