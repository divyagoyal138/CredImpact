'use client'

import { useState } from 'react'

export interface BarChartSeries {
  key: string
  name: string
  color: string
}

export interface BarChartItem {
  label?: string
  [key: string]: any
}

export interface BarChartProps {
  data?: BarChartItem[]
  series?: BarChartSeries[]
  height?: number
}

export default function BarChart({
  data = [],
  series = [
    { key: 'val1', name: 'Posted', color: '#f59e0b' },
    { key: 'val2', name: 'Applications', color: '#3b82f6' }
  ],
  height = 200
}: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (!data || data.length === 0) return null

  const allValues = data.flatMap(d => series.map(s => Number(d[s.key]) || 0))
  const maxValue = Math.max(...allValues, 10)
  const yMax = Math.ceil(maxValue * 1.2)

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-end gap-3 mb-2">
        {series.map(s => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span>{s.name}</span>
          </div>
        ))}
      </div>

      <div className="relative flex items-end justify-between gap-1.5 sm:gap-2.5 pt-7 pb-1 border-b border-border w-full overflow-hidden" style={{ height }}>
        {data.map((item, idx) => (
          <div
            key={item.label || idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="relative flex-1 flex flex-col items-center h-full justify-end group min-w-0 cursor-pointer"
          >
            {/* Tooltip on hover bounded */}
            {hoveredIdx === idx && (
              <div className="absolute -top-11 z-20 pointer-events-none rounded-lg border border-border bg-popover px-2 py-1 shadow-md text-[10px] whitespace-nowrap backdrop-blur-md max-w-[140px]">
                <p className="font-bold text-foreground border-b border-border/60 pb-0.5 mb-0.5 truncate">{item.label}</p>
                {series.map(s => (
                  <div key={s.key} className="flex items-center justify-between gap-2 text-muted-foreground">
                    <span className="flex items-center gap-1 truncate">
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      {s.name}:
                    </span>
                    <strong className="text-foreground shrink-0">{item[s.key] || 0}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Bars container */}
            <div className="flex items-end justify-center gap-1 w-full h-[78%] px-0.5">
              {series.map(s => {
                const val = Number(item[s.key]) || 0
                const heightPercent = Math.max((val / yMax) * 100, 6)

                return (
                  <div
                    key={s.key}
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: s.color
                    }}
                    className={`w-full max-w-[20px] rounded-t-md transition-all duration-300 ${
                      hoveredIdx === idx ? 'brightness-110 shadow-xs scale-y-105 origin-bottom' : 'opacity-90 hover:opacity-100'
                    }`}
                  />
                )
              })}
            </div>

            {/* X-axis label */}
            <span className="mt-1.5 text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate w-full text-center block">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
