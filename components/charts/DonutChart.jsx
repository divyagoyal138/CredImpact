'use client'

import { useState } from 'react'

export default function DonutChart({ data = [], centerLabel = 'Total', height = 180 }) {
  const [activeIndex, setActiveIndex] = useState(null)

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0)

  let accumulatedAngle = 0
  const radius = 62
  const strokeWidth = 16
  const center = 90
  const circumference = 2 * Math.PI * radius

  const slices = data.map((item, idx) => {
    const percentage = total > 0 ? item.value / total : 0
    const strokeDasharray = `${percentage * circumference} ${circumference}`
    const strokeDashoffset = -accumulatedAngle * circumference
    accumulatedAngle += percentage

    return {
      ...item,
      percentage: Math.round(percentage * 100),
      strokeDasharray,
      strokeDashoffset,
      idx
    }
  })

  const activeItem = activeIndex !== null ? data[activeIndex] : null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full min-w-0 overflow-hidden">
      <div className="relative flex items-center justify-center shrink-0 mx-auto sm:mx-0" style={{ width: height, height }}>
        <svg viewBox="0 0 180 180" className="w-full h-full transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-secondary/40"
          />
          {slices.map((slice) => (
            <circle
              key={slice.name || slice.idx}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={activeIndex === slice.idx ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 cursor-pointer origin-center"
              onMouseEnter={() => setActiveIndex(slice.idx)}
              onMouseLeave={() => setActiveIndex(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          <span className="text-xl font-bold text-foreground leading-tight">
            {activeItem ? activeItem.value : total}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground max-w-[90px] truncate">
            {activeItem ? activeItem.name : centerLabel}
          </span>
        </div>
      </div>

      <div className="w-full min-w-0 space-y-1.5 flex-1">
        {slices.map((slice) => (
          <div
            key={slice.name}
            onMouseEnter={() => setActiveIndex(slice.idx)}
            onMouseLeave={() => setActiveIndex(null)}
            className={`flex items-center justify-between p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer min-w-0 ${
              activeIndex === slice.idx ? 'bg-secondary border border-border shadow-xs' : 'hover:bg-secondary/50'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 overflow-hidden pr-1">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="text-xs font-medium text-foreground truncate">{slice.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-foreground">{slice.value}</span>
              <span className="text-[10px] font-semibold text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded-md">
                {slice.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
