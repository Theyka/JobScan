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
}

export type ChartOptions = {
  responsive: boolean
  maintainAspectRatio: boolean
  onClick: (event: unknown, elements: Array<{ index: number }>) => void
  plugins: {
    legend: {
      display: boolean
    }
    tooltip: ChartTooltipOptions
  }
  scales: {
    x: {
      grid: {
        display: boolean
        drawBorder: boolean
        drawTicks: boolean
      }
      border: {
        display: boolean
      }
      ticks: {
        color: string
      }
    }
    y: {
      grid: {
        display: boolean
        color: string
        drawBorder: boolean
        drawTicks: boolean
      }
      border: {
        display: boolean
      }
      ticks: {
        color: string
        stepSize: number
      }
    }
  }
}

export type ChartDataset = {
  label: string
  data: number[]
  backgroundColor: string | string[]
  borderRadius: number
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
