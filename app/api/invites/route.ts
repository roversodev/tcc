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

    // Novo fluxo: inserir diretamente se o usuário já existe
    const { data: targetProfile, error: findErr } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle()

    if (findErr) {
      return NextResponse.json({ error: findErr.message }, { status: 400 })
    }
    if (!targetProfile?.id) {
      return NextResponse.json({ error: "Usuário não encontrado pelo email. Peça para se cadastrar." }, { status: 404 })
    }

    // Evitar duplicidade de vínculo
    const { data: existing } = await supabaseAdmin
      .from("company_members")
      .select("id")
      .eq("company_id", companyId)
      .eq("user_id", targetProfile.id)
      .maybeSingle()

    if (existing?.id) {
      return NextResponse.json({ error: "Usuário já é membro desta empresa" }, { status: 409 })
    }

    // Inserir vínculo de membro na empresa (service role ignora RLS)
    const { error: memberErr } = await supabaseAdmin
      .from("company_members")
      .insert({
        company_id: companyId,
        user_id: targetProfile.id,
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