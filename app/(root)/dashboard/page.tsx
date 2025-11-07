"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/lib/contexts/app-context"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import data from "../data.json"

export default function Page() {
  const supabase = createClient()
  const { user, currentCompany } = useAppContext()
  const router = useRouter()
  const [allowed, setAllowed] = useState(true)

  useEffect(() => {
    const check = async () => {
      if (!user?.id || !currentCompany?.id) return
      const { data: membership } = await supabase
        .from("company_members")
        .select("role")
        .eq("company_id", currentCompany.id)
        .eq("user_id", user.id)
        .maybeSingle()
      if (membership?.role === "member") {
        setAllowed(false)
        router.replace("/agenda")
      }
    }
    check()
  }, [user?.id, currentCompany?.id])

  if (!allowed) return null
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable data={data} />
        </div>
      </div>
    </div>
  )
}
