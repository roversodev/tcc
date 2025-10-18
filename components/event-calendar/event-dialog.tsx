"use client"

import { useEffect, useMemo, useState } from "react"
import { RiCalendarLine, RiDeleteBinLine } from "@remixicon/react"
import { format, isBefore } from "date-fns"
import { ptBR } from "date-fns/locale"

import type {
  CalendarEvent,
  EventColor,
} from '@/components/event-calendar'
import {
  DefaultEndHour,
  DefaultStartHour,
  EndHour,
  StartHour,
} from '@/components/event-calendar/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface EventDialogProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onSave: (event: CalendarEvent & { clientId?: string; serviceId?: string }) => void
  onDelete: (eventId: string) => void
  clients?: { id: string; nome: string }[]
  services?: { id: string; header: string; duration_minutes: number }[]
  onServiceChange?: (serviceId: string, startDate: Date) => Date
}

export function EventDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  clients = [],
  services = [],
  onServiceChange,
}: EventDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`)
  const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`)
  const [allDay, setAllDay] = useState(false)
  const [clientId, setClientId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [color, setColor] = useState<EventColor>("sky")
  const [error, setError] = useState<string | null>(null)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  // Debug log to check what event is being passed
  useEffect(() => {
    console.log("EventDialog received event:", event)
  }, [event])

  useEffect(() => {
    if (event) {
      setTitle(event.title || "")
      setDescription(event.description || "")

      const start = new Date(event.start)
      const end = new Date(event.end)

      setStartDate(start)
      setEndDate(end)
      setStartTime(formatTimeForInput(start))
      setEndTime(formatTimeForInput(end))
      setAllDay(event.allDay || false)
      setClientId(event.clientId || "")
      setServiceId(event.serviceId || "")
      setColor((event.color as EventColor) || "sky")
      setError(null) // Reset error when opening dialog
    } else {
      resetForm()
    }
  }, [event])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setStartDate(new Date())
    setEndDate(new Date())
    setStartTime(`${DefaultStartHour}:00`)
    setEndTime(`${DefaultEndHour}:00`)
    setAllDay(false)
    setClientId("")
    setServiceId("")
    setColor("sky")
    setError(null)
  }

  const formatTimeForInput = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = Math.floor(date.getMinutes() / 15) * 15
    return `${hours}:${minutes.toString().padStart(2, "0")}`
  }

  // Memoize time options so they're only calculated once
  const timeOptions = useMemo(() => {
    const options = []
    for (let hora = StartHour; hora <= EndHour; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 15) {
        const horaFormatada = hora.toString().padStart(2, "0")
        const minutoFormatado = minuto.toString().padStart(2, "0")
        const valor = `${horaFormatada}:${minutoFormatado}`
        // Use a fixed date to avoid unnecessary date object creations
        const data = new Date(2000, 0, 1, hora, minuto)
        const rotulo = format(data, "HH:mm")
        options.push({ value: valor, label: rotulo })
      }
    }
    return options
  }, []) // Empty dependency array ensures this only runs once

  // Handle service selection and auto-calculate end time
  const handleServiceChange = (selectedServiceId: string) => {
    setServiceId(selectedServiceId)
    
    if (selectedServiceId && onServiceChange && !allDay) {
      const startDateTime = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        parseInt(startTime.split(":")[0]),
        parseInt(startTime.split(":")[1])
      )
      
      const calculatedEndDate = onServiceChange(selectedServiceId, startDateTime)
      
      // Verificar se a data calculada é válida
      if (calculatedEndDate && !isNaN(calculatedEndDate.getTime())) {
        setEndDate(calculatedEndDate)
        setEndTime(formatTimeForInput(calculatedEndDate))
      } else {
        console.error("Data de fim calculada é inválida:", calculatedEndDate)
      }
    }
  }

  const handleSave = () => {
    if (!title.trim()) {
      setError("O título é obrigatório")
      return
    }

    if (!clientId) {
      setError("Selecione um cliente")
      return
    }

    if (!serviceId) {
      setError("Selecione um serviço")
      return
    }

    const startDateTime = allDay
      ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      : new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
          parseInt(startTime.split(":")[0]),
          parseInt(startTime.split(":")[1])
        )

    const endDateTime = allDay
      ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
      : new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          parseInt(endTime.split(":")[0]),
          parseInt(endTime.split(":")[1])
        )

    if (endDateTime <= startDateTime && !allDay) {
      setError("A data/hora de fim deve ser posterior à de início")
      return
    }

    const selectedClient = clients.find(c => c.id === clientId)
    const selectedService = services.find(s => s.id === serviceId)

    const newEvent: CalendarEvent & { clientId?: string; serviceId?: string } = {
      id: event?.id || "", // Para novos eventos, deixar vazio para o banco gerar UUID
      title: title.trim() || (selectedService ? selectedService.header : "Evento sem título"),
      description: description.trim(),
      start: startDateTime,
      end: endDateTime,
      allDay,
      cliente: selectedClient?.nome,
      clientId,
      serviceId,
      color,
    }

    onSave(newEvent)
    onClose()
  }

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id)
      onClose()
    }
  }

  const colorOptions = [
    { value: "sky", label: "Azul", bgClass: "bg-sky-500", borderClass: "border-sky-500" },
    { value: "amber", label: "Âmbar", bgClass: "bg-amber-500", borderClass: "border-amber-500" },
    { value: "violet", label: "Violeta", bgClass: "bg-violet-500", borderClass: "border-violet-500" },
    { value: "rose", label: "Rosa", bgClass: "bg-rose-500", borderClass: "border-rose-500" },
    { value: "emerald", label: "Esmeralda", bgClass: "bg-emerald-500", borderClass: "border-emerald-500" },
    { value: "orange", label: "Laranja", bgClass: "bg-orange-500", borderClass: "border-orange-500" },
  ] as const

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? "Editar Compromisso" : "Novo Compromisso"}
          </DialogTitle>
          <DialogDescription>
            {event 
              ? "Edite as informações do compromisso." 
              : "Preencha as informações para agendar um novo compromisso."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="title">Título do Evento *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título do evento"
            />
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="cliente">Cliente *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="cliente">
                <SelectValue placeholder="Selecionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="servico">Serviço *</Label>
            <Select value={serviceId} onValueChange={handleServiceChange}>
              <SelectTrigger id="servico">
                <SelectValue placeholder="Selecionar serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.header} ({service.duration_minutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="description">Observações</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 *:not-first:mt-1.5">
              <Label htmlFor="start-date">Data de Inicio</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant={"outline"}
                    className={cn(
                      "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "truncate",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </span>
                    <RiCalendarLine
                      size={16}
                      className="text-muted-foreground/80 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    defaultMonth={startDate}
                    locale={ptBR}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date)
                        // If end date is before the new start date, update it to match the start date
                        if (isBefore(endDate, date)) {
                          setEndDate(date)
                        }
                        setError(null)
                        setStartDateOpen(false)
                        
                        // Recalculate end time if service is selected
                        if (serviceId && onServiceChange && !allDay) {
                          const startDateTime = new Date(
                            date.getFullYear(),
                            date.getMonth(),
                            date.getDate(),
                            parseInt(startTime.split(":")[0]),
                            parseInt(startTime.split(":")[1])
                          )
                          const calculatedEndDate = onServiceChange(serviceId, startDateTime)
                          
                          // Verificar se a data calculada é válida
                          if (calculatedEndDate && !isNaN(calculatedEndDate.getTime())) {
                            setEndDate(calculatedEndDate)
                            setEndTime(formatTimeForInput(calculatedEndDate))
                          }
                        }
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="min-w-28 *:not-first:mt-1.5">
                <Label htmlFor="start-time">Hora de Inicio</Label>
                <Select 
                  value={startTime} 
                  onValueChange={(value) => {
                    setStartTime(value)
                    // Recalculate end time if service is selected
                    if (serviceId && onServiceChange) {
                      const startDateTime = new Date(
                        startDate.getFullYear(),
                        startDate.getMonth(),
                        startDate.getDate(),
                        parseInt(value.split(":")[0]),
                        parseInt(value.split(":")[1])
                      )
                      const calculatedEndDate = onServiceChange(serviceId, startDateTime)
                      
                      // Verificar se a data calculada é válida
                      if (calculatedEndDate && !isNaN(calculatedEndDate.getTime())) {
                        setEndDate(calculatedEndDate)
                        setEndTime(formatTimeForInput(calculatedEndDate))
                      }
                    }
                  }}
                >
                  <SelectTrigger id="start-time">
                    <SelectValue placeholder="Hora de Inicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1 *:not-first:mt-1.5">
              <Label htmlFor="end-date">Data de Fim</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant={"outline"}
                    className={cn(
                      "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "truncate",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      {endDate && !isNaN(endDate.getTime()) ? format(endDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </span>
                    <RiCalendarLine
                      size={16}
                      className="text-muted-foreground/80 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    defaultMonth={endDate}
                    disabled={{ before: startDate }}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date)
                        setError(null)
                        setEndDateOpen(false)
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="min-w-28 *:not-first:mt-1.5">
                <Label htmlFor="end-time">Hora de Fim</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger id="end-time">
                    <SelectValue placeholder="Hora de Fim" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="*:not-first:mt-1.5">
            <Checkbox
              id="all-day"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked as boolean)}
            />
            <Label htmlFor="all-day">Dia Inteiro</Label>
          </div>

          <fieldset className="space-y-4">
            <legend className="text-foreground text-sm leading-none font-medium">
              Etiqueta
            </legend>
            <RadioGroup
              className="flex gap-1.5"
              defaultValue={colorOptions[0]?.value}
              value={color}
              onValueChange={(value: EventColor) => setColor(value)}
            >
              {colorOptions.map((colorOption) => (
                <RadioGroupItem
                  key={colorOption.value}
                  id={`color-${colorOption.value}`}
                  value={colorOption.value}
                  aria-label={colorOption.label}
                  className={cn(
                    "size-6 shadow-none",
                    colorOption.bgClass,
                    colorOption.borderClass
                  )}
                />
              ))}
            </RadioGroup>
          </fieldset>
        </div>
        <DialogFooter className="flex-row sm:justify-between">
          {event?.id && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              aria-label="Delete event"
            >
              <RiDeleteBinLine size={16} aria-hidden="true" />
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
