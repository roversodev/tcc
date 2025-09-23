"use client"

import React, { useState } from "react"
import { EventCalendar } from "@/components/event-calendar"
import { CalendarEvent } from "@/components/event-calendar/types"
import { toast } from "sonner"
import { addDays, setHours, setMinutes, subDays } from "date-fns"

// Dados fictícios adaptados para o formato CalendarEvent
const eventosIniciais: CalendarEvent[] = [
  {
    id: "1",
    title: "Corte de Cabelo",
    description: "Corte masculino tradicional",
    start: subDays(new Date(), 24),
    end: subDays(new Date(), 24),
    allDay: false,
    color: "sky",
    location: "Salão - Cadeira 1",
    cliente: "João Silva",
  },
  {
    id: "2",
    title: "Entrega de Encomenda",
    description: "Entrega de bolo de aniversário personalizado",
    start: setMinutes(setHours(subDays(new Date(), 9), 14), 0),
    end: setMinutes(setHours(subDays(new Date(), 9), 14), 30),
    color: "amber",
    location: "Rua das Flores, 123",
    cliente: "Maria Santos",
  },
  {
    id: "3",
    title: "Consulta Nutricional - Ana Costa",
    description: "Primeira consulta e avaliação",
    start: setMinutes(setHours(subDays(new Date(), 13), 9), 0),
    end: setMinutes(setHours(subDays(new Date(), 13), 10), 0),
    color: "emerald",
    location: "Consultório",
  },
  {
    id: "4",
    title: "Manicure - Carla Oliveira",
    description: "Manicure e pedicure completa",
    start: setMinutes(setHours(new Date(), 10), 0),
    end: setMinutes(setHours(new Date(), 11), 30),
    color: "rose",
    location: "Estúdio de Beleza",
  },
  {
    id: "5",
    title: "Reunião com Fornecedor",
    description: "Negociação de preços de produtos de beleza",
    start: setMinutes(setHours(addDays(new Date(), 1), 15), 0),
    end: setMinutes(setHours(addDays(new Date(), 1), 16), 0),
    color: "violet",
    location: "Café Central",
  },
  {
    id: "6",
    title: "Workshop de Culinária",
    description: "Aula de doces gourmet para grupo",
    start: setMinutes(setHours(addDays(new Date(), 3), 14), 0),
    end: setMinutes(setHours(addDays(new Date(), 3), 17), 0),
    color: "orange",
    location: "Cozinha Experimental",
  },
  {
    id: "7",
    title: "Massagem Relaxante - Pedro Lima",
    description: "Sessão de massagem terapêutica",
    start: setMinutes(setHours(addDays(new Date(), 4), 16), 0),
    end: setMinutes(setHours(addDays(new Date(), 4), 17), 0),
    color: "sky",
    location: "Clínica de Estética",
  },
  {
    id: "8",
    title: "Aula de Pilates - Turma Manhã",
    description: "Aula em grupo - nível intermediário",
    start: setMinutes(setHours(addDays(new Date(), 5), 8), 0),
    end: setMinutes(setHours(addDays(new Date(), 5), 9), 0),
    color: "emerald",
    location: "Estúdio de Pilates",
  },
  {
    id: "9",
    title: "Corte e Escova - Fernanda Rocha",
    description: "Corte feminino com escova modeladora",
    start: setMinutes(setHours(addDays(new Date(), 5), 14), 0),
    end: setMinutes(setHours(addDays(new Date(), 5), 16), 0),
    color: "rose",
    location: "Salão - Cadeira 2",
  },
  {
    id: "10",
    title: "Entrega de Marmitas",
    description: "Rota de entregas - 15 marmitas",
    start: setMinutes(setHours(addDays(new Date(), 5), 11), 0),
    end: setMinutes(setHours(addDays(new Date(), 5), 13), 0),
    color: "amber",
    location: "Região Centro",
  },
  {
    id: "11",
    title: "Personal Training - Roberto Alves",
    description: "Treino funcional personalizado",
    start: setMinutes(setHours(addDays(new Date(), 9), 7), 0),
    end: setMinutes(setHours(addDays(new Date(), 9), 8), 0),
    color: "violet",
    location: "Academia Particular",
  },
  {
    id: "12",
    title: "Feira de Artesanato",
    description: "Venda de produtos artesanais",
    start: addDays(new Date(), 17),
    end: addDays(new Date(), 17),
    allDay: true,
    color: "orange",
    location: "Praça da Matriz",
  },
  {
    id: "13",
    title: "Curso de Aperfeiçoamento",
    description: "Novas técnicas de design de sobrancelhas",
    start: setMinutes(setHours(addDays(new Date(), 26), 9), 0),
    end: setMinutes(setHours(addDays(new Date(), 27), 17), 0),
    color: "sky",
    location: "Centro de Capacitação",
  },
]

export default function AgendaPage() {
  const [eventos, setEventos] = useState<CalendarEvent[]>(eventosIniciais)

  const handleEventAdd = (novoEvento: CalendarEvent) => {
    setEventos(prev => [...prev, novoEvento])
    toast.success("Compromisso agendado com sucesso!")
  }

  const handleEventUpdate = (eventoAtualizado: CalendarEvent) => {
    setEventos(prev => 
      prev.map(evento => 
        evento.id === eventoAtualizado.id ? eventoAtualizado : evento
      )
    )
    toast.success("Compromisso atualizado com sucesso!")
  }

  const handleEventDelete = (eventoId: string) => {
    setEventos(prev => prev.filter(evento => evento.id !== eventoId))
    toast.success("Compromisso cancelado com sucesso!")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie seus compromissos e horários de atendimento
          </p>
        </div>
      </div>

      <EventCalendar
        events={eventos}
        onEventAdd={handleEventAdd}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        initialView="month"
        className="w-full"
      />
    </div>
  )
}