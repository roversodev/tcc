"use client"

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppContext } from '@/lib/contexts/app-context'
import { Event, EventInsert, EventUpdate } from '@/lib/database.types'
import { CalendarEvent } from '@/components/event-calendar/types'
import { addMinutes } from 'date-fns'
import { useClients } from './use-clients'
import { useServices } from './use-services'

interface EventsStats {
  total: number
  agendados: number
  confirmados: number
  concluidos: number
  cancelados: number
  proximosSeteDias: number
}

export function useEvents() {
  const { currentCompany, user } = useAppContext()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Usar hooks existentes para clientes e serviços
  const { clients, loading: clientsLoading } = useClients()
  const { services, loading: servicesLoading } = useServices()

  console.log("useEvents - Clientes:", clients)
  console.log("useEvents - Serviços:", services)

  // Buscar eventos
  const fetchEvents = async () => {
    if (!currentCompany?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          clients (
            id,
            nome
          ),
          services (
            id,
            header,
            duration_minutes
          )
        `)
        .eq('company_id', currentCompany.id)
        .order('start_date')

      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      console.error('Erro ao buscar eventos:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Converter Event para CalendarEvent
  const eventToCalendarEvent = (event: Event & { 
    clients?: { id: string; nome: string } | null;
    services?: { id: string; header: string; duration_minutes: number } | null;
  }): CalendarEvent => {
    return {
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      start: new Date(event.start_date),
      end: new Date(event.end_date),
      allDay: event.all_day,
      color: event.color,
      cliente: event.clients?.nome || event.cliente || undefined,
      // Campos adicionais para controle interno
      clientId: event.client_id || undefined,
      serviceId: event.service_id || undefined,
      status: event.status,
    }
  }

  // Converter CalendarEvent para EventInsert
  const calendarEventToEventInsert = (
    calendarEvent: CalendarEvent & { clientId?: string; serviceId?: string }
  ): Omit<EventInsert, 'company_id' | 'created_by' | 'id'> => {
    return {
      client_id: calendarEvent.clientId || null,
      service_id: calendarEvent.serviceId || null,
      title: calendarEvent.title,
      description: calendarEvent.description || null,
      start_date: calendarEvent.start?.toISOString() || '',
      end_date: calendarEvent.end?.toISOString() || '',
      all_day: calendarEvent.allDay || false,
      color: calendarEvent.color || 'sky',
      status: 'scheduled',
    }
  }

  // Criar evento
  const createEvent = async (eventData: CalendarEvent & { clientId?: string; serviceId?: string }) => {
    if (!currentCompany?.id || !user?.id) {
      throw new Error('Empresa ou usuário não encontrado')
    }

    try {
      const insertData = calendarEventToEventInsert(eventData)
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...insertData,
          company_id: currentCompany.id,
          created_by: user.id,
          status: 'scheduled' // Usar o valor correto do enum
        })
        .select(`
          *,
          clients (
            id,
            nome
          ),
          services (
            id,
            header,
            duration_minutes
          )
        `)
        .single()

      if (error) throw error
      
      await fetchEvents() // Recarregar lista
      return eventToCalendarEvent(data)
    } catch (err) {
      console.error('Erro ao criar evento:', err)
      throw err
    }
  }

  // Atualizar evento
  const updateEvent = async (id: string, eventData: CalendarEvent & { clientId?: string; serviceId?: string }) => {
    try {
      const updateData = calendarEventToEventInsert(eventData)
      
      const { data, error } = await supabase
        .from('events')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('company_id', currentCompany?.id)
        .select(`
          *,
          clients (
            id,
            nome
          ),
          services (
            id,
            header,
            duration_minutes
          )
        `)
        .single()

      if (error) throw error
      
      await fetchEvents() // Recarregar lista
      return eventToCalendarEvent(data)
    } catch (err) {
      console.error('Erro ao atualizar evento:', err)
      throw err
    }
  }

  // Deletar evento
  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('company_id', currentCompany?.id)

      if (error) throw error
      
      await fetchEvents() // Recarregar lista
      return true // Retornar true para indicar sucesso
    } catch (err) {
      console.error('Erro ao deletar evento:', err)
      throw err
    }
  }

  // Atualizar status do evento
  const updateEventStatus = async (id: string, status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('company_id', currentCompany?.id)

      if (error) throw error
      
      await fetchEvents() // Recarregar lista
    } catch (err) {
      console.error('Erro ao atualizar status do evento:', err)
      throw err
    }
  }

  // Calcular estatísticas dos eventos
  const eventsStats: EventsStats = {
    total: events.length,
    agendados: events.filter(event => event.status === 'scheduled').length,
    confirmados: events.filter(event => event.status === 'confirmed').length,
    concluidos: events.filter(event => event.status === 'completed').length,
    cancelados: events.filter(event => event.status === 'cancelled').length,
    proximosSeteDias: events.filter(event => {
      const eventDate = new Date(event.start_date)
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)
      return eventDate >= today && eventDate <= nextWeek && event.status !== 'cancelled'
    }).length
  }

  // Converter eventos para CalendarEvents
  const calendarEvents: CalendarEvent[] = events.map(event => eventToCalendarEvent(event))

  // Calcular data de fim baseada no serviço selecionado
  const calculateEndDate = (serviceId: string, startDate: Date): Date => {
    const service = services.find(s => s.id === serviceId)
    if (service && service.duration_minutes) {
      return addMinutes(startDate, service.duration_minutes)
    }
    return addMinutes(startDate, 60) // Default 1 hora
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (currentCompany?.id) {
      fetchEvents()
    }
  }, [currentCompany?.id])

  // Calcular loading combinado
  const combinedLoading = loading || clientsLoading || servicesLoading

  return {
    events,
    calendarEvents,
    clients,
    services,
    loading: combinedLoading,
    error,
    eventsStats,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    updateEventStatus,
    calculateEndDate,
    eventToCalendarEvent,
    calendarEventToEventInsert,
  }
}