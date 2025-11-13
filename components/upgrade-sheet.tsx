"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { usePlan } from "@/hooks/use-plan"
import { Check, X } from "lucide-react"

export function UpgradeSheet({ trigger }: { trigger?: React.ReactNode }) {
    const [selected, setSelected] = useState<'plus' | 'pro'>('plus')
    const [loading, setLoading] = useState(false)
    const { plan } = usePlan()

    const prices = {
        plus: "R$99,90 / mês",
        pro: "R$119,90 / mês",
    }

    const priceShort = {
        plus: "R$99,90",
        pro: "R$119,90",
    }

    const descriptions: Record<'plus' | 'pro', string> = {
        plus: "Para pequenas equipes começando e precisando de mais potência.",
        pro: "Para equipes que precisam colaborar convidando usuários.",
    }

    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

    async function startCheckout() {
        try {
            setLoading(true)
            const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: selected }),
            })
            const json = await res.json()
            if (json.url) {
                window.location.href = json.url
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                {trigger ?? <Button variant="default" className="w-full">Upgrade de Plano</Button>}
            </SheetTrigger>
            <SheetContent className="p-6 sm:w-[720px]">
                <SheetHeader>
                    <SheetTitle>Upgrade de Plano</SheetTitle>
                </SheetHeader>

                {/* Breadcrumb e descrição */}
                <div className="mt-4 space-y-2">
                    <div className="text-sm text-muted-foreground">
                        <span className="capitalize">{plan}</span>
                        <span className="mx-2">{" > "}</span>
                        <span className="font-semibold capitalize">{selected}</span>
                    </div>
                    <p className="text-lg">{descriptions[selected]}</p>
                </div>

                {/* Seleção de plano */}
                <div className="mt-6 space-y-3">
                    <label className="flex items-center justify-between rounded-lg border p-4 cursor-pointer">
                        <div className="flex items-center gap-3">
                            <input
                                type="radio"
                                name="plan"
                                checked={selected === 'plus'}
                                onChange={() => setSelected('plus')}
                            />
                            <div>
                                <div className="font-medium">Plus</div>
                                <div className="text-xs text-muted-foreground">Acesso a Estoque</div>
                            </div>
                        </div>
                        <div className="font-medium text-xs">{prices.plus}</div>
                    </label>

                    <label className="flex items-center justify-between rounded-lg border p-4 cursor-pointer">
                        <div className="flex items-center gap-3">
                            <input
                                type="radio"
                                name="plan"
                                checked={selected === 'pro'}
                                onChange={() => setSelected('pro')}
                            />
                            <div>
                                <div className="font-medium">Pro</div>
                                <div className="text-xs text-muted-foreground">Convidar usuários para a empresa</div>
                            </div>
                        </div>
                        <div className="font-medium text-xs">{prices.pro}</div>
                    </label>
                </div>

                {/* Comparativo estilo tabela com strike e realce */}
                <div className="mt-8 rounded-xl border overflow-hidden">
                    <div className="px-4 py-3 border-b flex items-center gap-2 text-xs">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="line-through text-muted-foreground">Sem acesso ao Estoque</span>
                        <span className="font-semibold">Acesso ao Estoque</span>
                    </div>
                    <div className="px-4 py-3 border-b flex items-center gap-2 text-xs">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="line-through text-muted-foreground">Sem Movimentações</span>
                        <span className="font-semibold">Movimentações disponíveis</span>
                    </div>
                    <div className="px-4 py-3 border-b flex items-center gap-2 text-xs">
                        {selected === 'pro' ? (
                            <>
                                <Check className="w-4 h-4 text-green-500" />
                                <span className="line-through text-muted-foreground">Sem Convites</span>
                                <span className="font-semibold">Convidar usuários para a empresa</span>
                            </>
                        ) : (
                            <>
                                <X className="w-4 h-4 text-red-500" />
                                <span className="text-muted-foreground">Convites indisponíveis no {cap(selected)}</span>
                            </>
                        )}
                    </div>
                    <div className="px-4 py-3 flex items-center gap-2 text-xs">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Suporte</span>
                        {selected === 'pro' ? (
                            <span className="text-muted-foreground">Email e WhatsApp</span>
                        ) : (
                            <span className="text-muted-foreground">Email</span>
                        )}
                    </div>
                </div>

                {/* Botão de upgrade com preço à direita */}
                <div className="mt-6">
                    <Button
                        className="w-full justify-between"
                        onClick={startCheckout}
                        disabled={loading}
                    >
                        <span>{loading ? "Iniciando..." : `Upgrade para ${selected.charAt(0).toUpperCase() + selected.slice(1)}`}</span>
                        <span className="font-medium">{selected === "plus" ? "R$99,90" : "R$119,90"}</span>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}