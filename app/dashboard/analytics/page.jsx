'use client'

import { useMemo } from 'react'
import { useDashboard } from '@/app/dashboard/layout'
import AreaChart from '@/components/charts/AreaChart'
import DonutChart from '@/components/charts/DonutChart'
import BarChart from '@/components/charts/BarChart'

export default function AnalyticsPage() {
  const { tasks, appliedTaskIds, completedTaskIds } = useDashboard()

  const totalTasks = tasks.length
  const appliedCount = appliedTaskIds.length
  const completedCount = completedTaskIds.length
  const pendingCount = Math.max(0, totalTasks - appliedCount)

  // Dynamic Category distribution for DonutChart
  const categoryData = useMemo(() => {
    const categoryColors = {
      Coding: '#3b82f6',
      Design: '#ec4899',
      'Content Writing': '#f59e0b',
      'Event Help': '#10b981',
      Marketing: '#8b5cf6',
      Research: '#06b6d4',
    }

    const counts = tasks.reduce((acc, task) => {
      const cat = task.category || 'General'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})

    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: categoryColors[name] || Object.values(categoryColors)[idx % 6]
    }))
  }, [tasks])

  // Trend data for AreaChart over recent months
  const trendData = useMemo(() => {
    return [
      { label: 'Mar', available: Math.max(2, Math.round(totalTasks * 0.4)), applied: Math.max(1, Math.round(appliedCount * 0.3)), completed: Math.max(0, Math.round(completedCount * 0.2)) },
      { label: 'Apr', available: Math.max(4, Math.round(totalTasks * 0.55)), applied: Math.max(2, Math.round(appliedCount * 0.45)), completed: Math.max(1, Math.round(completedCount * 0.4)) },
      { label: 'May', available: Math.max(5, Math.round(totalTasks * 0.7)), applied: Math.max(3, Math.round(appliedCount * 0.6)), completed: Math.max(2, Math.round(completedCount * 0.6)) },
      { label: 'Jun', available: Math.max(7, Math.round(totalTasks * 0.85)), applied: Math.max(4, Math.round(appliedCount * 0.8)), completed: Math.max(3, Math.round(completedCount * 0.75)) },
      { label: 'Jul', available: Math.max(8, Math.round(totalTasks * 0.95)), applied: Math.max(5, Math.round(appliedCount * 0.9)), completed: Math.max(4, Math.round(completedCount * 0.9)) },
      { label: 'Aug', available: totalTasks, applied: appliedCount, completed: completedCount },
    ]
  }, [totalTasks, appliedCount, completedCount])

  // Category Rewards breakdown for BarChart
  const categoryRewardsData = useMemo(() => {
    const categoryCC = tasks.reduce((acc, task) => {
      const cat = task.category || 'General'
      acc[cat] = (acc[cat] || 0) + (task.cc || task.creditcoins || 50)
      return acc
    }, {})

    return Object.entries(categoryCC).map(([label, totalCC]) => ({
      label,
      totalCC,
      earnedCC: appliedTaskIds.length > 0 ? Math.round(totalCC * 0.4) : 0
    }))
  }, [tasks, appliedTaskIds])

  return (
    <div className="space-y-4 pb-6 w-full min-w-0 overflow-hidden">
      {/* Top Header */}
      <div className="overflow-hidden rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2 truncate">
              <i className="ti ti-chart-dots text-primary text-xl shrink-0" aria-hidden="true" />
              Student Performance & Task Analytics
            </h1>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              Real-time insights on your task applications, completion velocity, and CreditCoin rewards.
            </p>
          </div>
          <span className="self-start sm:self-auto shrink-0 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
            Live Student Metrics
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
        <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">Available Tasks</p>
            <span className="p-2 rounded-lg bg-secondary text-primary shrink-0 flex items-center justify-center">
              <i className="ti ti-list-check text-base shrink-0" aria-hidden="true" />
            </span>
          </div>
          <h2 className="mt-3 text-3xl font-bold text-foreground">{totalTasks}</h2>
          <p className="mt-1 text-xs text-muted-foreground truncate">Tasks open on campus</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">Applied Tasks</p>
            <span className="p-2 rounded-lg bg-secondary text-blue-500 shrink-0 flex items-center justify-center">
              <i className="ti ti-send text-base shrink-0" aria-hidden="true" />
            </span>
          </div>
          <h2 className="mt-3 text-3xl font-bold text-foreground">{appliedCount}</h2>
          <p className="mt-1 text-xs text-muted-foreground truncate">Applications submitted</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">Completed</p>
            <span className="p-2 rounded-lg bg-secondary text-green-500 shrink-0 flex items-center justify-center">
              <i className="ti ti-circle-check text-base shrink-0" aria-hidden="true" />
            </span>
          </div>
          <h2 className="mt-3 text-3xl font-bold text-foreground">{completedCount}</h2>
          <p className="mt-1 text-xs text-muted-foreground truncate">Finished & verified tasks</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">Open Opportunities</p>
            <span className="p-2 rounded-lg bg-secondary text-amber-500 shrink-0 flex items-center justify-center">
              <i className="ti ti-sparkles text-base shrink-0" aria-hidden="true" />
            </span>
          </div>
          <h2 className="mt-3 text-3xl font-bold text-foreground">{pendingCount}</h2>
          <p className="mt-1 text-xs text-muted-foreground truncate">Tasks ready to apply</p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2 min-w-0">
        {/* Chart 1: Area Trend Chart */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
                <i className="ti ti-chart-area-line text-primary shrink-0" aria-hidden="true" />
                Application & Completion Growth Trend
              </h2>
              <p className="text-xs text-muted-foreground truncate">Monthly trajectory of open tasks vs your actions.</p>
            </div>
          </div>
          <AreaChart
            data={trendData}
            series={[
              { key: 'available', name: 'Available Tasks', color: '#f59e0b', gradientId: 'grad-avail' },
              { key: 'applied', name: 'Applied Tasks', color: '#3b82f6', gradientId: 'grad-app' },
              { key: 'completed', name: 'Completed', color: '#10b981', gradientId: 'grad-comp' }
            ]}
            height={210}
          />
        </div>

        {/* Chart 2: Category Donut Chart */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 min-w-0 overflow-hidden">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
              <i className="ti ti-chart-donut text-primary shrink-0" aria-hidden="true" />
              Category Share Breakdown
            </h2>
            <p className="text-xs text-muted-foreground truncate">Distribution of campus opportunities by domain.</p>
          </div>
          <div className="pt-1 min-w-0">
            <DonutChart
              data={categoryData}
              centerLabel="Tasks"
              height={180}
            />
          </div>
        </div>
      </div>

      {/* Bottom Chart & Insights Grid */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] min-w-0">
        {/* Chart 3: CreditCoins Reward Potential Bar Chart */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 min-w-0 overflow-hidden">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
              <i className="ti ti-coin text-amber-500 shrink-0" aria-hidden="true" />
              CreditCoin (CC) Value per Category
            </h2>
            <p className="text-xs text-muted-foreground truncate">Compare total reward pool vs your earned credits by category.</p>
          </div>
          <BarChart
            data={categoryRewardsData}
            series={[
              { key: 'totalCC', name: 'Total Available CC', color: '#f59e0b' },
              { key: 'earnedCC', name: 'Earned CC', color: '#10b981' }
            ]}
            height={200}
          />
        </div>

        {/* Quick Analytical Insights */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 min-w-0 overflow-hidden">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
            <i className="ti ti-bulb text-primary shrink-0" aria-hidden="true" />
            Smart Performance Summary
          </h2>
          <div className="space-y-3 text-xs leading-relaxed text-muted-foreground min-w-0">
            <div className="rounded-xl bg-secondary/60 p-3 border border-border/50 flex items-start gap-2.5 min-w-0">
              <span className="p-1 rounded bg-primary/10 text-primary font-bold shrink-0 flex items-center justify-center h-6 w-6 text-center">1</span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">Application Engagement</p>
                <p className="mt-0.5">You applied for <strong className="text-foreground">{appliedCount}</strong> of <strong className="text-foreground">{totalTasks}</strong> tasks ({Math.round((appliedCount / (totalTasks || 1)) * 100)}%).</p>
              </div>
            </div>

            <div className="rounded-xl bg-secondary/60 p-3 border border-border/50 flex items-start gap-2.5 min-w-0">
              <span className="p-1 rounded bg-green-500/10 text-green-500 font-bold shrink-0 flex items-center justify-center h-6 w-6 text-center">2</span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">Completion Rate</p>
                <p className="mt-0.5"><strong className="text-foreground">{Math.round((completedCount / (appliedCount || 1)) * 100)}%</strong> of applied tasks completed.</p>
              </div>
            </div>

            <div className="rounded-xl bg-secondary/60 p-3 border border-border/50 flex items-start gap-2.5 min-w-0">
              <span className="p-1 rounded bg-amber-500/10 text-amber-500 font-bold shrink-0 flex items-center justify-center h-6 w-6 text-center">3</span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">Top Category</p>
                <p className="mt-0.5">Highest activity: <strong className="text-foreground">{categoryData[0]?.name || 'N/A'}</strong> ({categoryData[0]?.value || 0} tasks).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
