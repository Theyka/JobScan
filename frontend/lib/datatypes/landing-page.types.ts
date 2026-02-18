import type { SourceKey } from '@/lib/datatypes/landing-data.types'

export type PageSizeOption = 18 | 36 | 54 | 72

export type SourceFilter = SourceKey | 'duplicates'

export type CountItem = {
  name: string
  count: number
}

export type SalaryRange = {
  id: string
  label: string
  min: number | null
  max: number | null
}

export type ChartTooltipOptions = {
  backgroundColor: string
  titleColor: string
  bodyColor: string
  borderColor: string
  borderWidth: number
  padding: number
  displayColors?: boolean
  cornerRadius?: number
  [key: string]: unknown
}

type ChartFont = {
  weight?: string | number
  size?: number
}

type ChartAxisGrid = {
  display?: boolean
  color?: string
  drawBorder?: boolean
  drawTicks?: boolean
  [key: string]: unknown
}

type ChartAxisTicks = {
  color?: string
  stepSize?: number
  font?: ChartFont
  [key: string]: unknown
}

type ChartAxis = {
  grid: ChartAxisGrid
  border: {
    display?: boolean
    [key: string]: unknown
  }
  ticks: ChartAxisTicks
  [key: string]: unknown
}

export type ChartOptions = {
  responsive: boolean
  maintainAspectRatio: boolean
  onClick: (event: unknown, elements: Array<{ index?: number }>) => void
  plugins: {
    legend: {
      display: boolean
    }
    tooltip: ChartTooltipOptions
    [key: string]: unknown
  }
  scales: {
    x: ChartAxis
    y: ChartAxis
    [key: string]: ChartAxis
  }
  [key: string]: unknown
}

type ChartColor = string | CanvasGradient | CanvasPattern

export type ChartDataset = {
  label: string
  data: number[]
  backgroundColor: ChartColor | ChartColor[]
  borderRadius?: number
  hoverBackgroundColor?: ChartColor | ChartColor[]
  [key: string]: unknown
}

export type ChartData = {
  labels: string[]
  datasets: ChartDataset[]
}

export type ChartConfig = {
  type: 'bar'
  data: ChartData
  options: ChartOptions
}

export type ChartInstance = {
  data: ChartData
  options: ChartOptions
  update: () => void
  destroy: () => void
}

export type ChartConstructor = new (context: CanvasRenderingContext2D, config: ChartConfig) => ChartInstance
