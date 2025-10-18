export type CalendarView = "month" | "week" | "day" | "agenda"

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  allDay?: boolean
  color?: EventColor
  cliente?: string
  // Campos adicionais para integração com backend
  clientId?: string
  serviceId?: string
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
}

export type EventColor =
  | "sky"
  | "amber"
  | "violet"
  | "rose"
  | "emerald"
  | "orange"
