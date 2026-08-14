'use client'

import { useState } from 'react'

export default function AreaChart({
  data = [],
  series = [
    { key: 'val1', name: 'Series 1', color: '#f59e0b', gradientId: 'grad1' },
    { key: 'val2', name: 'Series 2', color: '#10b981', gradientId: 'grad2' }
  ],
  height = 220
}) {
  const [hoverIndex, setHoverIndex] = useState(null)

  if (!data || data.length === 0) return null

  const svgWidth = 600
  const svgHeight = 200
  const paddingLeft = 36
  const paddingRight = 16
  const paddingTop = 20
  const paddingBottom = 30

  const chartWidth = svgWidth - paddingLeft - paddingRight
  const chartHeight = svgHeight - paddingTop - paddingBottom

  const allValues = data.flatMap(d => series.map(s => d[s.key] || 0))
  const maxValue = Math.max(...allValues, 10)
  const yMax = Math.ceil(maxValue * 1.15)

  const getX = (index) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2
    return paddingLeft + (index / (data.length - 1)) * chartWidth
  }

  const getY = (value) => {
    return paddingTop + chartHeight - (value / yMax) * chartHeight
  }

  const generatePath = (key) => {
    return data.reduce((acc, point, i) => {
      const x = getX(i)
      const y = getY(point[key] || 0)
      if (i === 0) return `M ${x},${y}`

      const prevX = getX(i - 1)
      const prevY = getY(data[i - 1][key] || 0)
      const cp1x = prevX + (x - prevX) / 2
      const cp1y = prevY
      const cp2x = prevX + (x - prevX) / 2
      const cp2y = y
      return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y}`
    }, '')
  }

  const generateAreaPath = (key) => {
    const linePath = generatePath(key)
    const firstX = getX(0)
    const lastX = getX(data.length - 1)
    const bottomY = paddingTop + chartHeight
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`
  }

  const yTicks = [0, Math.round(yMax * 0.33), Math.round(yMax * 0.66), yMax]

  // Clamp tooltip positioning within 12% to 88%
  const getTooltipLeft = (idx) => {
    const rawPercent = (getX(idx) / svgWidth) * 100
    return Math.min(86, Math.max(14, rawPercent))
  }

  return (
    <div className="w-full overflow-hidden">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-end gap-3 mb-2">
        {series.map(s => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="truncate">{s.name}</span>
          </div>
        ))}
      </div>

      <div className="relative w-full overflow-hidden" style={{ height }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {series.map(s => (
              <linearGradient key={s.gradientId || s.key} id={s.gradientId || s.key} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines & Y labels */}
          {yTicks.map((tick) => {
            const y = getY(tick)
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px] font-medium"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* Areas & Lines */}
          {series.map(s => (
            <g key={s.key}>
              <path
                d={generateAreaPath(s.key)}
                fill={`url(#${s.gradientId || s.key})`}
              />
              <path
                d={generatePath(s.key)}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* X Axis labels */}
          {data.map((point, i) => {
            const x = getX(i)
            return (
              <text
                key={point.label || i}
                x={x}
                y={svgHeight - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px] font-medium"
              >
                {point.label}
              </text>
            )
          })}

          {/* Hover interactive vertical line and points */}
          {data.map((point, i) => {
            const x = getX(i)
            const isHovered = hoverIndex === i

            return (
              <g key={`hover-${i}`}>
                <rect
                  x={x - chartWidth / Math.max(data.length * 2, 1)}
                  y={paddingTop}
                  width={chartWidth / Math.max(data.length, 1)}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                />

                {isHovered && (
                  <>
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={paddingTop + chartHeight}
                      stroke="currentColor"
                      strokeOpacity="0.25"
                      strokeDasharray="3 3"
                    />
                    {series.map(s => (
                      <circle
                        key={`pt-${s.key}`}
                        cx={x}
                        cy={getY(point[s.key] || 0)}
                        r="4.5"
                        fill={s.color}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    ))}
                  </>
                )}
              </g>
            )
          })}
        </svg>

        {/* Hover Tooltip bounded within card */}
        {hoverIndex !== null && data[hoverIndex] && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover px-2.5 py-1.5 shadow-lg backdrop-blur-md max-w-[160px]"
            style={{
              left: `${getTooltipLeft(hoverIndex)}%`,
              top: `${Math.max(15, (getY(Math.max(...series.map(s => data[hoverIndex][s.key] || 0))) / svgHeight) * 100 - 12)}%`
            }}
          >
            <p className="text-[11px] font-bold text-foreground border-b border-border pb-0.5 mb-1 truncate">
              {data[hoverIndex].label}
            </p>
            <div className="space-y-0.5">
              {series.map(s => (
                <div key={s.key} className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="flex items-center gap-1 text-muted-foreground truncate">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    {s.name}:
                  </span>
                  <span className="font-semibold text-foreground shrink-0">{data[hoverIndex][s.key] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
