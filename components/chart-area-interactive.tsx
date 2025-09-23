"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Gráfico interativo de faturamento"

const chartData = [
  { date: "2024-04-01", faturamento: 6200, despesas: 2100 },
  { date: "2024-04-02", faturamento: 5800, despesas: 1950 },
  { date: "2024-04-03", faturamento: 7100, despesas: 2300 },
  { date: "2024-04-04", faturamento: 6800, despesas: 2200 },
  { date: "2024-04-05", faturamento: 8200, despesas: 2800 },
  { date: "2024-04-06", faturamento: 7500, despesas: 2500 },
  { date: "2024-04-07", faturamento: 6900, despesas: 2100 },
  { date: "2024-04-08", faturamento: 9100, despesas: 3200 },
  { date: "2024-04-09", faturamento: 5200, despesas: 1800 },
  { date: "2024-04-10", faturamento: 7300, despesas: 2400 },
  { date: "2024-04-11", faturamento: 6800, despesas: 2200 },
  { date: "2024-04-12", faturamento: 7900, despesas: 2600 },
  { date: "2024-04-13", faturamento: 8500, despesas: 2900 },
  { date: "2024-04-14", faturamento: 6200, despesas: 2000 },
  { date: "2024-04-15", faturamento: 5800, despesas: 1850 },
  { date: "2024-04-16", faturamento: 7200, despesas: 2350 },
  { date: "2024-04-17", faturamento: 8800, despesas: 3100 },
  { date: "2024-04-18", faturamento: 9200, despesas: 3300 },
  { date: "2024-04-19", faturamento: 6900, despesas: 2200 },
  { date: "2024-04-20", faturamento: 5500, despesas: 1750 },
  { date: "2024-04-21", faturamento: 7600, despesas: 2450 },
  { date: "2024-04-22", faturamento: 8100, despesas: 2700 },
  { date: "2024-04-23", faturamento: 6700, despesas: 2150 },
  { date: "2024-04-24", faturamento: 9500, despesas: 3400 },
  { date: "2024-04-25", faturamento: 7800, despesas: 2550 },
  { date: "2024-04-26", faturamento: 5900, despesas: 1900 },
  { date: "2024-04-27", faturamento: 8700, despesas: 3000 },
  { date: "2024-04-28", faturamento: 6400, despesas: 2100 },
  { date: "2024-04-29", faturamento: 7700, despesas: 2500 },
  { date: "2024-04-30", faturamento: 9000, despesas: 3200 },
  { date: "2024-05-01", faturamento: 6800, despesas: 2200 },
  { date: "2024-05-02", faturamento: 8300, despesas: 2800 },
  { date: "2024-05-03", faturamento: 7100, despesas: 2300 },
  { date: "2024-05-04", faturamento: 9100, despesas: 3300 },
  { date: "2024-05-05", faturamento: 8600, despesas: 2950 },
  { date: "2024-05-06", faturamento: 9800, despesas: 3500 },
  { date: "2024-05-07", faturamento: 7400, despesas: 2400 },
  { date: "2024-05-08", faturamento: 6100, despesas: 1950 },
  { date: "2024-05-09", faturamento: 7800, despesas: 2550 },
  { date: "2024-05-10", faturamento: 8400, despesas: 2850 },
  { date: "2024-05-11", faturamento: 7600, despesas: 2450 },
  { date: "2024-05-12", faturamento: 6900, despesas: 2200 },
  { date: "2024-05-13", faturamento: 6500, despesas: 2050 },
  { date: "2024-05-14", faturamento: 9400, despesas: 3350 },
  { date: "2024-05-15", faturamento: 8900, despesas: 3100 },
  { date: "2024-05-16", faturamento: 7700, despesas: 2500 },
  { date: "2024-05-17", faturamento: 9600, despesas: 3450 },
  { date: "2024-05-18", faturamento: 8200, despesas: 2750 },
  { date: "2024-05-19", faturamento: 6800, despesas: 2150 },
  { date: "2024-05-20", faturamento: 7300, despesas: 2350 },
  { date: "2024-05-21", faturamento: 5700, despesas: 1800 },
  { date: "2024-05-22", faturamento: 5400, despesas: 1700 },
  { date: "2024-05-23", faturamento: 8000, despesas: 2650 },
  { date: "2024-05-24", faturamento: 8500, despesas: 2900 },
  { date: "2024-05-25", faturamento: 7200, despesas: 2300 },
  { date: "2024-05-26", faturamento: 6600, despesas: 2100 },
  { date: "2024-05-27", faturamento: 9300, despesas: 3300 },
  { date: "2024-05-28", faturamento: 7000, despesas: 2250 },
  { date: "2024-05-29", faturamento: 5800, despesas: 1850 },
  { date: "2024-05-30", faturamento: 8100, despesas: 2700 },
  { date: "2024-05-31", faturamento: 7500, despesas: 2400 },
  { date: "2024-06-01", faturamento: 7200, despesas: 2300 },
  { date: "2024-06-02", faturamento: 9200, despesas: 3250 },
  { date: "2024-06-03", faturamento: 6300, despesas: 2000 },
  { date: "2024-06-04", faturamento: 8800, despesas: 3050 },
  { date: "2024-06-05", faturamento: 5900, despesas: 1850 },
  { date: "2024-06-06", faturamento: 8200, despesas: 2750 },
  { date: "2024-06-07", faturamento: 8700, despesas: 2950 },
  { date: "2024-06-08", faturamento: 9000, despesas: 3150 },
  { date: "2024-06-09", faturamento: 9500, despesas: 3400 },
  { date: "2024-06-10", faturamento: 6800, despesas: 2150 },
  { date: "2024-06-11", faturamento: 6100, despesas: 1950 },
  { date: "2024-06-12", faturamento: 9800, despesas: 3500 },
  { date: "2024-06-13", faturamento: 5600, despesas: 1750 },
  { date: "2024-06-14", faturamento: 9100, despesas: 3200 },
  { date: "2024-06-15", faturamento: 8300, despesas: 2800 },
  { date: "2024-06-16", faturamento: 8600, despesas: 2900 },
  { date: "2024-06-17", faturamento: 9700, despesas: 3450 },
  { date: "2024-06-18", faturamento: 6400, despesas: 2050 },
  { date: "2024-06-19", faturamento: 8000, despesas: 2650 },
  { date: "2024-06-20", faturamento: 9300, despesas: 3300 },
  { date: "2024-06-21", faturamento: 7100, despesas: 2250 },
  { date: "2024-06-22", faturamento: 8400, despesas: 2850 },
  { date: "2024-06-23", faturamento: 9900, despesas: 3550 },
  { date: "2024-06-24", faturamento: 6700, despesas: 2100 },
  { date: "2024-06-25", faturamento: 6900, despesas: 2200 },
  { date: "2024-06-26", faturamento: 9000, despesas: 3150 },
  { date: "2024-06-27", faturamento: 9400, despesas: 3350 },
  { date: "2024-06-28", faturamento: 7300, despesas: 2350 },
  { date: "2024-06-29", faturamento: 6200, despesas: 1950 },
  { date: "2024-06-30", faturamento: 9600, despesas: 3400 },
]

const chartConfig = {
  faturamento: {
    label: "Faturamento",
    color: "var(--chart-1)",
  },
  despesas: {
    label: "Despesas",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Faturamento vs Despesas</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Análise financeira dos últimos 3 meses
          </span>
          <span className="@[540px]/card:hidden">Últimos 3 meses</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              aria-label="Selecionar período"
            >
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 dias
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillFaturamento" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-faturamento)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-faturamento)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-despesas)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-despesas)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="despesas"
              type="natural"
              fill="url(#fillDespesas)"
              stroke="var(--color-despesas)"
              stackId="a"
            />
            <Area
              dataKey="faturamento"
              type="natural"
              fill="url(#fillFaturamento)"
              stroke="var(--color-faturamento)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
