"use client"

import { toast } from "sonner"

import { EventCalendar } from "@/components/event-calendar"
import type { CalendarEvent } from "@/components/event-calendar"
import { useEvents } from "@/hooks/use-events"
import { IconLoader2 } from "@tabler/icons-react"

export default function AgendaPage() {
  // Hook único para integração com backend (já inclui clientes e serviços)
  const { 
    calendarEvents,
    clients,
    services,
    loading,
    createEvent, 
    updateEvent, 
    deleteEvent, 
    calculateEndDate 
  } = useEvents()

  console.log("Debug - Clientes:", clients)
  console.log("Debug - Serviços:", services)
  console.log("Debug - Eventos:", calendarEvents)

  const handleEventAdd = async (event: CalendarEvent & { clientId?: string; serviceId?: string }) => {
    try {
      console.log("Criando evento:", event)
      
      if (!event.clientId || !event.serviceId) {
        toast.error("Cliente e serviço são obrigatórios")
        return
      }

      const newEvent = await createEvent(event)

      if (newEvent) {
        toast.success("Evento criado com sucesso!")
      }
    } catch (error) {
      console.error("Erro ao criar evento:", error)
      toast.error("Erro ao criar evento")
    }
  }

  const handleEventUpdate = async (event: CalendarEvent & { clientId?: string; serviceId?: string }) => {
    try {
      if (!event.id) {
        toast.error("ID do evento não encontrado")
        return
      }

      if (!event.clientId || !event.serviceId) {
        toast.error("Cliente e serviço são obrigatórios")
        return
      }

      const updatedEvent = await updateEvent(event.id, event)

      if (updatedEvent) {
        toast.success("Evento atualizado com sucesso!")
      }
    } catch (error) {
      console.error("Erro ao atualizar evento:", error)
      toast.error("Erro ao atualizar evento")
    }
  }

  const handleEventDelete = async (eventId: string) => {
    try {
      const success = await deleteEvent(eventId)
      if (success) {
        toast.success("Evento excluído com sucesso!")
      }
    } catch (error) {
      console.error("Erro ao excluir evento:", error)
      toast.error("Erro ao excluir evento")
    }
  }

  const handleServiceChange = (serviceId: string, startDate: Date): Date => {
    return calculateEndDate(serviceId, startDate)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <IconLoader2 className="h-6 w-6 animate-spin" />
          <span>Carregando agenda...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
        <p className="text-muted-foreground">
          Gerencie seus compromissos e agendamentos
        </p>
      </div>

      <EventCalendar
        events={calendarEvents || []}
        onEventAdd={handleEventAdd}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        clients={clients}
        services={services}
        onServiceChange={handleServiceChange}
      />
    </div>
  )
}