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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
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

export const description = "Gift card value distribution over time"

const chartData = [
  { date: "2024-04-01", grocery: 2200, fastFood: 800, clothing: 450, other: 650 },
  { date: "2024-04-02", grocery: 2350, fastFood: 750, clothing: 520, other: 700 },
  { date: "2024-04-03", grocery: 2450, fastFood: 820, clothing: 480, other: 680 },
  { date: "2024-04-04", grocery: 2600, fastFood: 900, clothing: 550, other: 720 },
  { date: "2024-04-05", grocery: 2700, fastFood: 850, clothing: 600, other: 750 },
  { date: "2024-04-06", grocery: 2800, fastFood: 920, clothing: 580, other: 800 },
  { date: "2024-04-07", grocery: 2650, fastFood: 880, clothing: 530, other: 770 },
  { date: "2024-04-08", grocery: 2900, fastFood: 950, clothing: 620, other: 850 },
  { date: "2024-04-09", grocery: 2500, fastFood: 800, clothing: 500, other: 700 },
  { date: "2024-04-10", grocery: 2750, fastFood: 890, clothing: 560, other: 780 },
  { date: "2024-04-11", grocery: 3000, fastFood: 980, clothing: 650, other: 900 },
  { date: "2024-04-12", grocery: 2850, fastFood: 920, clothing: 590, other: 820 },
  { date: "2024-04-13", grocery: 3100, fastFood: 1000, clothing: 680, other: 950 },
  { date: "2024-04-14", grocery: 2700, fastFood: 850, clothing: 540, other: 750 },
  { date: "2024-04-15", grocery: 2600, fastFood: 820, clothing: 520, other: 730 },
  { date: "2024-04-16", grocery: 2750, fastFood: 880, clothing: 560, other: 780 },
  { date: "2024-04-17", grocery: 3200, fastFood: 1050, clothing: 720, other: 1000 },
  { date: "2024-04-18", grocery: 3300, fastFood: 1100, clothing: 750, other: 1050 },
  { date: "2024-04-19", grocery: 2800, fastFood: 900, clothing: 600, other: 820 },
  { date: "2024-04-20", grocery: 2550, fastFood: 800, clothing: 500, other: 720 },
  { date: "2024-04-21", grocery: 2700, fastFood: 860, clothing: 550, other: 760 },
  { date: "2024-04-22", grocery: 2850, fastFood: 920, clothing: 580, other: 800 },
  { date: "2024-04-23", grocery: 2750, fastFood: 880, clothing: 560, other: 780 },
  { date: "2024-04-24", grocery: 3050, fastFood: 980, clothing: 640, other: 880 },
  { date: "2024-04-25", grocery: 2900, fastFood: 930, clothing: 610, other: 840 },
  { date: "2024-04-26", grocery: 2600, fastFood: 820, clothing: 520, other: 730 },
  { date: "2024-04-27", grocery: 3250, fastFood: 1080, clothing: 740, other: 1020 },
  { date: "2024-04-28", grocery: 2750, fastFood: 880, clothing: 570, other: 790 },
  { date: "2024-04-29", grocery: 3000, fastFood: 960, clothing: 630, other: 870 },
  { date: "2024-04-30", grocery: 3400, fastFood: 1120, clothing: 780, other: 1080 },
  { date: "2024-05-01", grocery: 2800, fastFood: 900, clothing: 600, other: 820 },
  { date: "2024-05-02", grocery: 3100, fastFood: 1000, clothing: 670, other: 920 },
  { date: "2024-05-03", grocery: 2900, fastFood: 930, clothing: 610, other: 840 },
  { date: "2024-05-04", grocery: 3350, fastFood: 1100, clothing: 750, other: 1030 },
  { date: "2024-05-05", grocery: 3500, fastFood: 1150, clothing: 800, other: 1100 },
  { date: "2024-05-06", grocery: 3600, fastFood: 1200, clothing: 850, other: 1150 },
  { date: "2024-05-07", grocery: 3200, fastFood: 1050, clothing: 720, other: 980 },
  { date: "2024-05-08", grocery: 2850, fastFood: 920, clothing: 600, other: 820 },
  { date: "2024-05-09", grocery: 2950, fastFood: 950, clothing: 630, other: 860 },
  { date: "2024-05-10", grocery: 3250, fastFood: 1050, clothing: 710, other: 970 },
  { date: "2024-05-11", grocery: 3150, fastFood: 1020, clothing: 690, other: 940 },
  { date: "2024-05-12", grocery: 2950, fastFood: 950, clothing: 630, other: 860 },
  { date: "2024-05-13", grocery: 2900, fastFood: 930, clothing: 610, other: 840 },
  { date: "2024-05-14", grocery: 3550, fastFood: 1180, clothing: 820, other: 1120 },
  { date: "2024-05-15", grocery: 3450, fastFood: 1140, clothing: 790, other: 1080 },
  { date: "2024-05-16", grocery: 3300, fastFood: 1080, clothing: 740, other: 1010 },
  { date: "2024-05-17", grocery: 3600, fastFood: 1200, clothing: 850, other: 1150 },
  { date: "2024-05-18", grocery: 3350, fastFood: 1100, clothing: 760, other: 1040 },
  { date: "2024-05-19", grocery: 2950, fastFood: 950, clothing: 640, other: 870 },
  { date: "2024-05-20", grocery: 2850, fastFood: 920, clothing: 600, other: 820 },
  { date: "2024-05-21", grocery: 2650, fastFood: 850, clothing: 550, other: 750 },
  { date: "2024-05-22", grocery: 2600, fastFood: 840, clothing: 540, other: 740 },
  { date: "2024-05-23", grocery: 3000, fastFood: 970, clothing: 660, other: 900 },
  { date: "2024-05-24", grocery: 3050, fastFood: 990, clothing: 670, other: 920 },
  { date: "2024-05-25", grocery: 2950, fastFood: 950, clothing: 640, other: 870 },
  { date: "2024-05-26", grocery: 2850, fastFood: 920, clothing: 610, other: 830 },
  { date: "2024-05-27", grocery: 3500, fastFood: 1160, clothing: 810, other: 1100 },
  { date: "2024-05-28", grocery: 3000, fastFood: 970, clothing: 660, other: 900 },
  { date: "2024-05-29", grocery: 2700, fastFood: 860, clothing: 570, other: 780 },
  { date: "2024-05-30", grocery: 3250, fastFood: 1060, clothing: 730, other: 990 },
  { date: "2024-05-31", grocery: 2900, fastFood: 940, clothing: 620, other: 850 },
  { date: "2024-06-01", grocery: 2850, fastFood: 920, clothing: 610, other: 830 },
  { date: "2024-06-02", grocery: 3550, fastFood: 1180, clothing: 820, other: 1120 },
  { date: "2024-06-03", grocery: 2750, fastFood: 880, clothing: 580, other: 800 },
  { date: "2024-06-04", grocery: 3500, fastFood: 1150, clothing: 800, other: 1090 },
  { date: "2024-06-05", grocery: 2700, fastFood: 860, clothing: 570, other: 780 },
  { date: "2024-06-06", grocery: 3050, fastFood: 980, clothing: 670, other: 920 },
  { date: "2024-06-07", grocery: 3300, fastFood: 1080, clothing: 740, other: 1010 },
  { date: "2024-06-08", grocery: 3400, fastFood: 1120, clothing: 780, other: 1060 },
  { date: "2024-06-09", grocery: 3600, fastFood: 1190, clothing: 840, other: 1140 },
  { date: "2024-06-10", grocery: 2900, fastFood: 930, clothing: 620, other: 850 },
  { date: "2024-06-11", grocery: 2750, fastFood: 880, clothing: 580, other: 800 },
  { date: "2024-06-12", grocery: 3700, fastFood: 1230, clothing: 870, other: 1180 },
  { date: "2024-06-13", grocery: 2700, fastFood: 860, clothing: 570, other: 780 },
  { date: "2024-06-14", grocery: 3500, fastFood: 1150, clothing: 800, other: 1090 },
  { date: "2024-06-15", grocery: 3350, fastFood: 1100, clothing: 760, other: 1040 },
  { date: "2024-06-16", grocery: 3400, fastFood: 1120, clothing: 780, other: 1060 },
  { date: "2024-06-17", grocery: 3650, fastFood: 1210, clothing: 860, other: 1160 },
  { date: "2024-06-18", grocery: 2800, fastFood: 900, clothing: 600, other: 820 },
  { date: "2024-06-19", grocery: 3300, fastFood: 1080, clothing: 740, other: 1010 },
  { date: "2024-06-20", grocery: 3550, fastFood: 1180, clothing: 820, other: 1120 },
  { date: "2024-06-21", grocery: 2900, fastFood: 930, clothing: 620, other: 850 },
  { date: "2024-06-22", grocery: 3250, fastFood: 1060, clothing: 730, other: 990 },
  { date: "2024-06-23", grocery: 3700, fastFood: 1240, clothing: 880, other: 1190 },
  { date: "2024-06-24", grocery: 2850, fastFood: 920, clothing: 600, other: 820 },
  { date: "2024-06-25", grocery: 2900, fastFood: 940, clothing: 620, other: 850 },
  { date: "2024-06-26", grocery: 3500, fastFood: 1150, clothing: 800, other: 1090 },
  { date: "2024-06-27", grocery: 3600, fastFood: 1190, clothing: 840, other: 1140 },
  { date: "2024-06-28", grocery: 2900, fastFood: 930, clothing: 620, other: 850 },
  { date: "2024-06-29", grocery: 2750, fastFood: 880, clothing: 580, other: 800 },
  { date: "2024-06-30", grocery: 3550, fastFood: 1180, clothing: 820, other: 1120 },
]

const chartConfig = {
  value: {
    label: "Gift Card Value",
  },
  grocery: {
    label: "Grocery",
    color: "var(--primary)",
  },
  fastFood: {
    label: "Fast Food",
    color: "hsl(var(--chart-2))",
  },
  clothing: {
    label: "Clothing",
    color: "hsl(var(--chart-3))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-4))",
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
        <CardTitle>Gift Card Value Distribution</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Value breakdown by category over time
          </span>
          <span className="@[540px]/card:hidden">Value by category</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "90d")
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) {
                setTimeRange(value)
              }
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
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
              <linearGradient id="fillGrocery" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-grocery)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-grocery)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillFastFood" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-fastFood)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-fastFood)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillClothing" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-clothing)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-clothing)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillOther" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-other)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-other)"
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
                return date.toLocaleDateString("en-US", {
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
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  valueFormatter={(value) => {
                    return `$${value}`
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="other"
              type="natural"
              fill="url(#fillOther)"
              stroke="var(--color-other)"
              stackId="a"
            />
            <Area
              dataKey="clothing"
              type="natural"
              fill="url(#fillClothing)"
              stroke="var(--color-clothing)"
              stackId="a"
            />
            <Area
              dataKey="fastFood"
              type="natural"
              fill="url(#fillFastFood)"
              stroke="var(--color-fastFood)"
              stackId="a"
            />
            <Area
              dataKey="grocery"
              type="natural"
              fill="url(#fillGrocery)"
              stroke="var(--color-grocery)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
