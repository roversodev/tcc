"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/lib/contexts/app-context"
import type { Plan } from "@/lib/plan"

export function usePlan() {
  const [plan, setPlan] = useState<Plan>('free')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { currentCompany } = useAppContext()

  useEffect(() => {
    async function fetchPlan() {
      if (!currentCompany?.id) {
        setPlan('free')
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('company_plans')
        .select('plan')
        .eq('company_id', currentCompany.id)
        .maybeSingle()

      if (error || !data) {
        setPlan('free')
      } else {
        setPlan((data.plan as Plan) ?? 'free')
      }
      setLoading(false)
    }
    fetchPlan()
  }, [currentCompany?.id, supabase])

  return { plan, loading }
}