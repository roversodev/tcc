import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import Stripe from "stripe"

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!
const PRICE_PLUS = process.env.STRIPE_PRICE_PLUS!
const PRICE_PRO  = process.env.STRIPE_PRICE_PRO!

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const sig = req.headers.get("stripe-signature") || ""
  let event
  const rawBody = await req.text()

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret)
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const companyId = session.metadata?.company_id
        const subscriptionId = session.subscription?.toString() ?? null
        const customerId = session.customer?.toString() ?? null
        const plan = session.metadata?.plan as 'plus' | 'pro' | undefined

        if (!companyId || !plan) break

        await admin.from('company_plans').upsert({
          company_id: companyId,
          plan,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          current_period_end: null,
        }, { onConflict: 'company_id' })
        break
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const priceId = sub.items?.data?.[0]?.price?.id as string | undefined
        const status = sub.status as string
        const periodEndUnix = (sub as any)?.current_period_end
        const periodEnd = typeof periodEndUnix === "number" ? new Date(periodEndUnix * 1000).toISOString() : null
        const plan = priceId === PRICE_PRO ? "pro" : priceId === PRICE_PLUS ? "plus" : "free"

        await admin.from("company_plans").update({
          plan,
          status,
          current_period_end: periodEnd,
          stripe_subscription_id: sub.id,
        }).eq("stripe_customer_id", customerId)
        break
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as any
        const customerId = sub.customer as string
        await admin.from('company_plans').update({
          plan: 'free',
          status: 'canceled',
          stripe_subscription_id: null,
        }).eq('stripe_customer_id', customerId)
        break
      }
      default:
        // ignore outros eventos
        break
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error("Webhook handling error", e)
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}