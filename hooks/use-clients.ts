"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppContext } from '@/lib/contexts/app-context'
import { Client, ClientInsert, ClientUpdate } from '@/lib/database.types'

export function useClients() {
  const { currentCompany, user } = useAppContext()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar clientes
  const fetchClients = async () => {
    if (!currentCompany?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('status', 'active')
        .order('nome')

      if (error) throw error
      setClients(data || [])
    } catch (err) {
      console.error('Erro ao buscar clientes:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Criar cliente
  const createClient = async (clientData: Omit<ClientInsert, 'company_id' | 'created_by'>) => {
    if (!currentCompany?.id || !user?.id) {
      throw new Error('Empresa ou usuário não encontrado')
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          company_id: currentCompany.id,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      
      await fetchClients() // Recarregar lista
      return data
    } catch (err) {
      console.error('Erro ao criar cliente:', err)
      throw err
    }
  }

  // Atualizar cliente
  const updateClient = async (id: string, clientData: ClientUpdate) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .eq('company_id', currentCompany?.id)
        .select()
        .single()

      if (error) throw error
      
      await fetchClients() // Recarregar lista
      return data
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err)
      throw err
    }
  }

  // Deletar cliente (soft delete)
  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: 'inactive' })
        .eq('id', id)
        .eq('company_id', currentCompany?.id)

      if (error) throw error
      
      await fetchClients() // Recarregar lista
    } catch (err) {
      console.error('Erro ao deletar cliente:', err)
      throw err
    }
  }

  // Estatísticas dos clientes
  const clientsStats = {
    total: clients.length,
    vip: clients.filter(client => client.categoria === 'VIP').length,
    regular: clients.filter(client => client.categoria === 'Regular').length,
    novo: clients.filter(client => client.categoria === 'Novo').length,
    totalRevenue: clients.reduce((total, client) => total + client.total_gasto, 0)
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (currentCompany?.id) {
      fetchClients()
    }
  }, [currentCompany?.id])

  return {
    clients,
    loading,
    error,
    clientsStats,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  }
}