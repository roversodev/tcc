import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const PRICE_PLUS = process.env.STRIPE_PRICE_PLUS!
const PRICE_PRO  = process.env.STRIPE_PRICE_PRO!

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json() as { plan: 'plus' | 'pro' }
    if (!plan || !['plus', 'pro'].includes(plan)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const admin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // pegar empresa atual do perfil ou primeira empresa
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, current_company_id')
      .eq('id', user.id)
      .maybeSingle()

    let companyId = profile?.current_company_id ?? null
    if (!companyId) {
      const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .limit(1)
      companyId = member?.[0]?.company_id ?? null
    }
    if (!companyId) {
      return NextResponse.json({ error: 'Nenhuma empresa associada' }, { status: 400 })
    }

    // busca/gera stripe_customer para a empresa
    const { data: existingPlan } = await admin
      .from('company_plans')
      .select('stripe_customer_id')
      .eq('company_id', companyId)
      .maybeSingle()

    let customerId = existingPlan?.stripe_customer_id ?? null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? undefined,
        metadata: { company_id: companyId },
      })
      customerId = customer.id
      await admin
        .from('company_plans')
        .upsert({
          company_id: companyId,
          plan: 'free',
          stripe_customer_id: customerId,
          status: 'incomplete',
        }, { onConflict: 'company_id' })
    }

    const priceId = plan === 'plus' ? PRICE_PLUS : PRICE_PRO

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'http://localhost:3000'}/dashboard?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'http://localhost:3000'}/dashboard?upgrade=cancel`,
      metadata: {
        company_id: companyId,
        plan,
        user_id: user.id,
      },
      // Adiciona metadados também na Subscription gerada
      subscription_data: {
        metadata: {
          company_id: companyId,
          plan,
          user_id: user.id,
        }
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error("checkout error", e)
    return NextResponse.json({ error: 'Erro ao iniciar checkout' }, { status: 500 })
  }
}