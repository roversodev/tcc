"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/lib/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeSheet } from "@/components/upgrade-sheet"
import { canAccess } from "@/lib/plan"

type Member = {
    id: string
    user_id: string
    role: "owner" | "admin" | "member"
    profile?: { full_name: string | null, email: string | null }
}

export default function ConfiguracoesPage() {
    const supabase = createClient()
    const { user, currentCompany } = useAppContext()
    const [loading, setLoading] = useState(true)
    const [members, setMembers] = useState<Member[]>([])
    const [companyForm, setCompanyForm] = useState({
        name: "",
        cnpj: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        country: "",
        website: "",
    })
    const { plan } = usePlan()

    // Controle de convites
    const [inviteRole, setInviteRole] = useState<"admin" | "member">("member")
    const [inviteEmail, setInviteEmail] = useState<string>("")
    const [inviteUserId, setInviteUserId] = useState<string>("")
    const [savingCompany, setSavingCompany] = useState(false)
    const [inviting, setInviting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [meRole, setMeRole] = useState<"owner" | "admin" | "member">("member")

    useEffect(() => {
        const init = async () => {
            if (!currentCompany?.id || !user?.id) return
            setLoading(true)
            setError(null)
            try {
                // Carregar dados da empresa
                const { data: company, error: cErr } = await supabase
                    .from("companies")
                    .select("*")
                    .eq("id", currentCompany.id)
                    .single()
                if (cErr) throw cErr
                setCompanyForm({
                    name: company.name || "",
                    cnpj: company.cnpj || "",
                    email: company.email || "",
                    phone: company.phone || "",
                    address: company.address || "",
                    city: company.city || "",
                    state: company.state || "",
                    zip_code: company.zip_code || "",
                    country: company.country || "",
                    website: company.website || "",
                })

                // Carregar membros com nome — CORRIGIDO: desambiguar a relação com profiles
                const { data: membs, error: mErr } = await supabase
                    .from("company_members")
                    .select("id, user_id, role, user_profile:profiles!company_members_user_id_fkey(full_name,email)")
                    .eq("company_id", currentCompany.id)
                if (mErr) throw mErr
                setMembers(
                    (membs || []).map((m: any) => ({
                        id: m.id,
                        user_id: m.user_id,
                        role: m.role,
                        profile: m.user_profile?.[0] || { full_name: null, email: null },
                    }))
                )

                const mine = (membs || []).find(m => m.user_id === user.id)
                setMeRole((mine?.role as any) || "member")
            } catch (e: any) {
                console.error(e)
                setError(e?.message || "Erro ao carregar configurações")
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [currentCompany?.id, user?.id])

    const canEditCompany = meRole === "owner" || meRole === "admin"
    const canInvite = meRole === "owner" || meRole === "admin"

    const handleSaveCompany = async () => {
        if (!currentCompany?.id) return
        setSavingCompany(true)
        setError(null)
        try {
            await supabase
                .from("companies")
                .update({
                    name: companyForm.name,
                    cnpj: companyForm.cnpj || null,
                    email: companyForm.email || null,
                    phone: companyForm.phone || null,
                    address: companyForm.address || null,
                    city: companyForm.city || null,
                    state: companyForm.state || null,
                    zip_code: companyForm.zip_code || null,
                    country: companyForm.country || null,
                    website: companyForm.website || null,
                })
                .eq("id", currentCompany.id)
            // sucesso silencioso
        } catch (e: any) {
            console.error(e)
            setError(e?.message || "Erro ao salvar dados da empresa")
        } finally {
            setSavingCompany(false)
        }
    }

    const handleInviteMember = async () => {
        if (!inviteEmail.trim()) {
            setError("Informe o e-mail do usuário a ser convidado.")
            return
        }
        setInviting(true)
        setError(null)
        try {
            const res = await fetch("/api/invites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || "Falha ao convidar")

            // atualizar lista de membros
            const { data: membs } = await supabase
                .from("company_members")
                .select("id, user_id, role, user_profile:profiles!company_members_user_id_fkey(full_name,email)")
                .eq("company_id", currentCompany!.id)

            setMembers(
                (membs || []).map((m: any) => ({
                    id: m.id,
                    user_id: m.user_id,
                    role: m.role,
                    profile: m.user_profile?.[0] || { full_name: null, email: null },
                }))
            )
            setInviteEmail("")
            setInviteRole("member")
        } catch (e: any) {
            console.error(e)
            setError(e?.message || "Erro ao convidar membro")
        } finally {
            setInviting(false)
        }
    }

    return (
        <div className="space-y-8 p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Configurações</h1>
                {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            {/* Empresa */}
            <div className="rounded-lg border bg-muted/50 p-4">
                <div className="mb-3 text-base font-semibold">Dados da Empresa</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {Object.entries(companyForm).map(([key, val]) => (
                        <div key={key}>
                            <Label className="capitalize">{key.replace("_", " ")}</Label>
                            <Input
                                value={val}
                                onChange={(e) => setCompanyForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                disabled={!canEditCompany}
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-4">
                    <Button onClick={handleSaveCompany} disabled={!canEditCompany || savingCompany}>
                        {savingCompany ? "Salvando..." : "Salvar alterações"}
                    </Button>
                    {!canEditCompany && (
                        <span className="ml-3 text-xs text-muted-foreground">
                            Apenas owner/admin podem editar os dados da empresa.
                        </span>
                    )}
                </div>
            </div>

            {/* Membros */}
            <div className="rounded-lg border bg-muted/50 p-4">
                <div className="mb-3 text-base font-semibold">Membros da Empresa</div>
                <div className="space-y-2">
                    {members.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Nenhum membro cadastrado.</div>
                    ) : (
                        members.map((m) => (
                            <div key={m.id} className="grid grid-cols-3 items-center gap-2">
                                <div className="text-sm">{m.profile?.full_name || "—"}</div>
                                <div className="text-xs text-muted-foreground">{m.profile?.email || "—"}</div>
                                <div className="text-right text-sm">
                                    {m.role === "owner" ? "Owner" : m.role === "admin" ? "Admin" : "Member"}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Convite */}
                <div className="mt-4">
                    <div className="mb-2 text-sm font-medium">Convidar novo membro</div>
                    <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-3">
                        {!canAccess(plan, 'invites') ? (
                            <div>
                                <p className="text-muted-foreground mb-4">
                                    Convites de usuários estão disponíveis apenas no plano Pro.
                                </p>
                                <UpgradeSheet />
                            </div>
                        ) : (
                            <>
                                <div className="sm:col-span-2">
                                    <Label>Email</Label>
                                    <Input
                                        placeholder="usuario@exemplo.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        disabled={!canInvite}
                                    />
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        Se o usuário já tiver cadastro, será adicionado à empresa pelo email.
                                        Caso não exista, peça para que se registre primeiro.
                                    </div>
                                </div>
                                <div>
                                    <Label>Papel</Label>
                                    <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)} disabled={!canInvite}>
                                        <SelectTrigger><SelectValue placeholder="Selecione o papel" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="member">Membro</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="mt-3">
                                    <Button onClick={handleInviteMember} disabled={!canInvite || inviting}>
                                        {inviting ? "Adicionando..." : "Adicionar à empresa"}
                                    </Button>
                                    {!canInvite && (
                                        <span className="ml-3 text-xs text-muted-foreground">
                                            Apenas owner/admin podem adicionar membros.
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}