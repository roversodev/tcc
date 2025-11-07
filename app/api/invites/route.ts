import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body?.email || "").trim().toLowerCase()
    const role = body?.role === "admin" ? "admin" : "member"

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    const supabase = await createServerClient()
    const supabaseAdmin = createAdminClient()

    // Usuário atual + empresa atual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("current_company_id")
      .eq("id", user.id)
      .maybeSingle()

    const companyId = profile?.current_company_id
    if (!companyId) {
      return NextResponse.json({ error: "Empresa atual não definida no perfil" }, { status: 400 })
    }

    // Verifica papel do usuário na empresa
    const { data: membership } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return NextResponse.json({ error: "Apenas owner/admin podem convidar" }, { status: 403 })
    }

    // Dispara convite por email
    const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
    if (inviteErr) {
      return NextResponse.json({ error: inviteErr.message }, { status: 400 })
    }

    const invitedUserId = invited.user?.id
    if (!invitedUserId) {
      return NextResponse.json({ error: "Convite enviado, mas não foi possível obter o ID do usuário" }, { status: 500 })
    }

    // Cria vínculo de membro na empresa (usando admin para não sofrer RLS)
    const { error: memberErr } = await supabaseAdmin
      .from("company_members")
      .insert({
        company_id: companyId,
        user_id: invitedUserId,
        role,
        invited_by: user.id,
        permissions: { can_view_dashboard: role !== "member" },
      })

    if (memberErr) {
      return NextResponse.json({ error: memberErr.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro ao convidar membro" }, { status: 500 })
  }
}