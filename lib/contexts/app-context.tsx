"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { useRouter } from 'next/navigation'

type Company = Database['public']['Tables']['companies']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type CompanyMember = Database['public']['Tables']['company_members']['Row']

interface AppContextType {
  user: User | null
  profile: Profile | null
  companies: Company[]
  currentCompany: Company | null
  loading: boolean
  switchCompany: (companyId: string) => Promise<void>
  refreshData: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

interface AppProviderProps {
  children: React.ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const fetchUserData = async (userId: string) => {
    try {
      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        // Se há erro de RLS, definir perfil como null
        setProfile(null)
        setCompanies([])
        setCurrentCompany(null)
        return
      }
      
      setProfile(profileData)

      // Se não há perfil, não buscar empresas
      if (!profileData) {
        setCompanies([])
        setCurrentCompany(null)
        return
      }

      // Buscar empresas do usuário - usar uma query mais simples para evitar RLS
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', userId)

      if (memberError) {
        console.error('Error fetching company members:', memberError)
        setCompanies([])
        setCurrentCompany(null)
        return
      }

      // Se há membros, buscar detalhes das empresas
      if (memberData && memberData.length > 0) {
        const companyIds = memberData.map(m => m.company_id)
        
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds)

        if (companiesError) {
          console.error('Error fetching companies:', companiesError)
          setCompanies([])
          setCurrentCompany(null)
          return
        }

        setCompanies(companiesData || [])

        // Definir empresa atual
        if (profileData.current_company_id) {
          const currentComp = companiesData?.find(c => c.id === profileData.current_company_id)
          setCurrentCompany(currentComp || companiesData?.[0] || null)
        } else {
          setCurrentCompany(companiesData?.[0] || null)
        }

        console.log("AppContext - Empresas carregadas:", companiesData?.length || 0)
        console.log("AppContext - Empresa atual:", companiesData?.[0]?.name || "Nenhuma")
      } else {
        setCompanies([])
        setCurrentCompany(null)
        console.log("AppContext - Nenhuma empresa encontrada para o usuário")
      }

    } catch (error) {
      console.error('Error fetching user data:', error)
      // Em caso de erro, definir estados como vazios
      setProfile(null)
      setCompanies([])
      setCurrentCompany(null)
    }
  }

  const refreshData = async () => {
    if (user) {
      await fetchUserData(user.id)
    }
  }

  const switchCompany = async (companyId: string) => {
    if (!user) return

    try {
      // Atualizar empresa atual no perfil
      const { error } = await supabase
        .from('profiles')
        .update({ current_company_id: companyId })
        .eq('id', user.id)

      if (error) throw error

      // Atualizar estado local
      const newCurrentCompany = companies.find(c => c.id === companyId)
      if (newCurrentCompany) {
        setCurrentCompany(newCurrentCompany)
        setProfile(prev => prev ? { ...prev, current_company_id: companyId } : null)
      }
    } catch (error) {
      console.error('Error switching company:', error)
    }
  }

  useEffect(() => {
    // Obter usuário atual
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        await fetchUserData(user.id)
      }
      
      setLoading(false)
    }

    getUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserData(session.user.id)
        } else {
          setProfile(null)
          setCompanies([])
          setCurrentCompany(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const value: AppContextType = {
    user,
    profile,
    companies,
    currentCompany,
    loading,
    switchCompany,
    refreshData,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}