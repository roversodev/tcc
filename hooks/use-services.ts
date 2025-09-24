"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppContext } from '@/lib/contexts/app-context'
import { Service, ServiceInsert, ServiceUpdate } from '@/lib/database.types'

interface ServicesStats {
  total: number
  ativos: number
  inativos: number
  duracaoMedia: number
  precoMedio: number
}

export function useServices() {
  const { currentCompany, user } = useAppContext()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Buscar serviços
  const fetchServices = async () => {
    if (!currentCompany?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('header')

      if (error) throw error
      setServices(data || [])
    } catch (err) {
      console.error('Erro ao buscar serviços:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Criar serviço
  const createService = async (serviceData: Omit<ServiceInsert, 'company_id' | 'created_by'>) => {
    if (!currentCompany?.id || !user?.id) {
      throw new Error('Empresa ou usuário não encontrado')
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          ...serviceData,
          company_id: currentCompany.id,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      
      await fetchServices() // Recarregar lista
      return data
    } catch (err) {
      console.error('Erro ao criar serviço:', err)
      throw err
    }
  }

  // Atualizar serviço
  const updateService = async (id: string, serviceData: ServiceUpdate) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update({
          ...serviceData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('company_id', currentCompany?.id)
        .select()
        .single()

      if (error) throw error
      
      await fetchServices() // Recarregar lista
      return data
    } catch (err) {
      console.error('Erro ao atualizar serviço:', err)
      throw err
    }
  }

  // Deletar serviço (soft delete)
  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ 
          status: 'Inativo',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('company_id', currentCompany?.id)

      if (error) throw error
      
      await fetchServices() // Recarregar lista
    } catch (err) {
      console.error('Erro ao deletar serviço:', err)
      throw err
    }
  }

  // Calcular estatísticas dos serviços
  const servicesStats: ServicesStats = {
    total: services.length,
    ativos: services.filter(service => service.status === 'Ativo').length,
    inativos: services.filter(service => service.status === 'Inativo').length,
    duracaoMedia: services.length > 0 
      ? Math.round(services.reduce((sum, service) => sum + service.duration_minutes, 0) / services.length)
      : 0,
    precoMedio: services.length > 0 && services.some(service => service.target)
      ? services
          .filter(service => service.target !== null)
          .reduce((sum, service) => sum + (service.target || 0), 0) / 
        services.filter(service => service.target !== null).length
      : 0
  }

  const permanentDeleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
        .eq('company_id', currentCompany?.id)

      if (error) throw error
      
      await fetchServices() // Recarregar lista
    } catch (err) {
      console.error('Erro ao deletar serviço permanentemente:', err)
      throw err
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (currentCompany?.id) {
      fetchServices()
    }
  }, [currentCompany?.id])

  return {
    services,
    loading,
    error,
    servicesStats,
    fetchServices,
    createService,
    updateService,
    deleteService,
    permanentDeleteService,
  }
}