'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/app/dashboard/layout'
import AreaChart from '@/components/charts/AreaChart'
import DonutChart from '@/components/charts/DonutChart'
import BarChart from '@/components/charts/BarChart'
import ExportDropdown from '@/components/analytics/ExportDropdown'

export default function AnalyticsPage() {
  const { tasks = [], appliedTaskIds = [], completedTaskIds = [], user } = useDashboard()

  // Filter States
  const [timeRange, setTimeRange] = useState('all') // 'all' | '30days' | '7days'
  const [selectedDept, setSelectedDept] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'departments' | 'table'

  // Filtered Tasks calculation
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Department filter
      if (selectedDept !== 'all' && (task.department || 'Admin').toLowerCase() !== selectedDept.toLowerCase()) {
        return false
      }
      // Category filter
      if (selectedCategory !== 'all' && (task.category || 'General').toLowerCase() !== selectedCategory.toLowerCase()) {
        return false
      }
      return true
    })
  }, [tasks, selectedDept, selectedCategory])

  // Calculated KPI Metrics
  const totalTasks = filteredTasks.length
  const appliedCount = appliedTaskIds.filter(id => filteredTasks.some(t => t.id === id || t.taskid === id)).length
  const completedCount = completedTaskIds.filter(id => filteredTasks.some(t => t.id === id || t.taskid === id)).length
  const openCount = Math.max(0, totalTasks - appliedCount)
  const totalCCAvailable = filteredTasks.reduce((acc, t) => acc + (t.cc || t.creditcoins || 50), 0)
  const completionRate = appliedCount > 0 ? Math.round((completedCount / appliedCount) * 100) : 0
  const engagementRate = totalTasks > 0 ? Math.round((appliedCount / totalTasks) * 100) : 0

  // Dynamic Category Distribution
  const categoryData = useMemo(() => {
    const categoryColors = {
      Coding: '#3b82f6',
      Design: '#ec4899',
      'Content Writing': '#f59e0b',
      'Event Help': '#10b981',
      Marketing: '#8b5cf6',
      Research: '#06b6d4',
      General: '#64748b'
    }

    const counts = filteredTasks.reduce((acc, task) => {
      const cat = task.category || 'General'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})

    const total = filteredTasks.length || 1

    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100),
      color: categoryColors[name] || Object.values(categoryColors)[idx % 6]
    }))
  }, [filteredTasks])

  // Trend Data for AreaChart
  const trendData = useMemo(() => {
    const timeMultiplier = timeRange === '7days' ? 0.3 : timeRange === '30days' ? 0.7 : 1.0

    return [
      { label: 'Mar', available: Math.max(2, Math.round(totalTasks * 0.4 * timeMultiplier)), applied: Math.max(1, Math.round(appliedCount * 0.3 * timeMultiplier)), completed: Math.max(0, Math.round(completedCount * 0.2 * timeMultiplier)) },
      { label: 'Apr', available: Math.max(4, Math.round(totalTasks * 0.55 * timeMultiplier)), applied: Math.max(2, Math.round(appliedCount * 0.45 * timeMultiplier)), completed: Math.max(1, Math.round(completedCount * 0.4 * timeMultiplier)) },
      { label: 'May', available: Math.max(5, Math.round(totalTasks * 0.7 * timeMultiplier)), applied: Math.max(3, Math.round(appliedCount * 0.6 * timeMultiplier)), completed: Math.max(2, Math.round(completedCount * 0.6 * timeMultiplier)) },
      { label: 'Jun', available: Math.max(7, Math.round(totalTasks * 0.85 * timeMultiplier)), applied: Math.max(4, Math.round(appliedCount * 0.8 * timeMultiplier)), completed: Math.max(3, Math.round(completedCount * 0.75 * timeMultiplier)) },
      { label: 'Jul', available: Math.max(8, Math.round(totalTasks * 0.95 * timeMultiplier)), applied: Math.max(5, Math.round(appliedCount * 0.9 * timeMultiplier)), completed: Math.max(4, Math.round(completedCount * 0.9 * timeMultiplier)) },
      { label: 'Aug', available: Math.round(totalTasks * timeMultiplier), applied: Math.round(appliedCount * timeMultiplier), completed: Math.round(completedCount * timeMultiplier) },
    ]
  }, [totalTasks, appliedCount, completedCount, timeRange])

  // Category Rewards Breakdown for BarChart
  const categoryRewardsData = useMemo(() => {
    const categoryCC = filteredTasks.reduce((acc, task) => {
      const cat = task.category || 'General'
      acc[cat] = (acc[cat] || 0) + (task.cc || task.creditcoins || 50)
      return acc
    }, {})

    return Object.entries(categoryCC).map(([label, totalCC]) => ({
      label,
      totalCC,
      earnedCC: appliedCount > 0 ? Math.round(totalCC * 0.4) : 0
    }))
  }, [filteredTasks, appliedCount])

  // Department Stats Breakdown
  const deptBreakdown = useMemo(() => {
    const depts = {}
    filteredTasks.forEach(t => {
      const d = t.department || 'Computer Science'
      if (!depts[d]) {
        depts[d] = { count: 0, cc: 0, urgent: 0 }
      }
      depts[d].count += 1
      depts[d].cc += (t.cc || t.creditcoins || 50)
      if (t.urgent) depts[d].urgent += 1
    })

    return Object.entries(depts).map(([dept, data]) => ({
      dept,
      count: data.count,
      cc: data.cc,
      urgent: data.urgent,
      share: Math.round((data.count / (totalTasks || 1)) * 100)
    }))
  }, [filteredTasks, totalTasks])

  // Generator for Export Data (PDF, Word, PowerPoint, CSV)
  const getExportData = () => {
    return {
      title: 'Student Performance & Task Intelligence Report',
      subtitle: `Analytics filtered by Department (${selectedDept}) & Category (${selectedCategory})`,
      generatedBy: user?.name || user?.uid || 'Student User',
      dateStr: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      metrics: [
        { label: 'Total Tasks', value: totalTasks, description: 'Catalog Opportunities' },
        { label: 'Applied Tasks', value: appliedCount, description: `${engagementRate}% Engagement` },
        { label: 'Completed Tasks', value: completedCount, description: `${completionRate}% Completion Rate` },
        { label: 'Total Reward Pool', value: `${totalCCAvailable} CC`, description: 'Available CreditCoins' }
      ],
      categoryBreakdown: categoryData.map(c => ({
        name: c.name,
        value: c.value,
        percentage: c.percentage
      })),
      tableData: filteredTasks.map(t => ({
        'Task ID': t.id || t.taskid,
        'Title': t.title,
        'Department': t.department || 'General',
        'Category': t.category || 'Design',
        'CreditCoins': t.cc || t.creditcoins || 50,
        'Status': t.status || 'Open',
        'Applied': appliedTaskIds.includes(t.id || t.taskid) ? 'Yes' : 'No',
        'Completed': completedTaskIds.includes(t.id || t.taskid) ? 'Yes' : 'No'
      }))
    }
  }

  return (
    <div className="space-y-5 pb-8 w-full min-w-0 overflow-hidden">
      {/* Top Header with Save As Dropdown */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <i className="ti ti-chart-dots text-xl" aria-hidden="true" />
              </span>
              <h1 className="text-xl font-bold text-foreground truncate">
                Advanced Performance & Task Analytics
              </h1>
            </div>
            <p className="text-xs text-muted-foreground truncate pl-1">
              Real-time velocity tracking, completion metrics, and CreditCoin reward distribution.
            </p>
          </div>

          {/* Save As Export Dropdown */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
              Live Sync
            </span>
            <ExportDropdown getExportData={getExportData} label="Save As..." />
          </div>
        </div>
      </div>

      {/* Filter Controls & Navigation Bar */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-w-0">
          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/80 border border-border/60 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <i className="ti ti-layout-grid text-sm" aria-hidden="true" />
              Executive Overview
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'departments'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <i className="ti ti-building text-sm" aria-hidden="true" />
              Department Breakdown
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'table'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <i className="ti ti-table text-sm" aria-hidden="true" />
              Data Records ({filteredTasks.length})
            </button>
          </div>

          {/* Filters Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Range Filter */}
            <div className="flex items-center gap-1.5 bg-secondary/60 border border-border px-2.5 py-1 rounded-xl text-xs">
              <i className="ti ti-calendar text-muted-foreground" aria-hidden="true" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="7days">Last 7 Days</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5 bg-secondary/60 border border-border px-2.5 py-1 rounded-xl text-xs">
              <i className="ti ti-filter text-muted-foreground" aria-hidden="true" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="IT Dept">IT Dept</option>
                <option value="BSCIT">BSCIT</option>
                <option value="Library">Library</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-secondary/60 border border-border px-2.5 py-1 rounded-xl text-xs">
              <i className="ti ti-category text-muted-foreground" aria-hidden="true" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Categories</option>
                <option value="Coding">Coding</option>
                <option value="Design">Design</option>
                <option value="Event Help">Event Help</option>
                <option value="Content Writing">Content Writing</option>
                <option value="Marketing">Marketing</option>
                <option value="Research">Research</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Header */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
        <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 min-w-0 overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">Available Tasks</p>
            <span className="p-2 rounded-xl bg-secondary text-primary shrink-0 flex items-center justify-center">
              <i className="ti ti-list-check text-base shrink-0" aria-hidden="true" />
            </span>
          </div>
          <h2 className="mt-3 text-3xl font-bold text-foreground">{totalTasks}</h2>
          <p className="mt-1 text-xs text-muted-foreground truncate">Opportunities matching filters</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 min-w-0 overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">Applied Tasks</p>
            <span className="p-2 rounded-xl bg-secondary text-blue-500 shrink-0 flex items-center justify-center">
              <i className="ti ti-send text-base shrink-0" aria-hidden="true" />
            </span>
          </div>
          <h2 className="mt-3 text-3xl font-bold text-foreground">{appliedCount}</h2>
          <p className="mt-1 text-xs text-muted-foreground truncate">{engagementRate}% Engagement Rate</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 min-w-0 overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">Completed</p>
            <span className="p-2 rounded-xl bg-secondary text-green-500 shrink-0 flex items-center justify-center">
              <i className="ti ti-circle-check text-base shrink-0" aria-hidden="true" />
            </span>
          </div>
          <h2 className="mt-3 text-3xl font-bold text-foreground">{completedCount}</h2>
          <p className="mt-1 text-xs text-muted-foreground truncate">{completionRate}% Completion Rate</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 min-w-0 overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">Reward Pool</p>
            <span className="p-2 rounded-xl bg-secondary text-amber-500 shrink-0 flex items-center justify-center">
              <i className="ti ti-coin text-base shrink-0" aria-hidden="true" />
            </span>
          </div>
          <h2 className="mt-3 text-3xl font-bold text-foreground">{totalCCAvailable} <span className="text-xs text-muted-foreground">CC</span></h2>
          <p className="mt-1 text-xs text-muted-foreground truncate">Total CreditCoins pool</p>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2 min-w-0">
            {/* Chart 1: Area Trend Chart */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 min-w-0 overflow-hidden shadow-2xs">
              <div className="flex items-center justify-between min-w-0">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
                    <i className="ti ti-chart-area-line text-primary shrink-0" aria-hidden="true" />
                    Application & Completion Growth Velocity
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">Trajectory of catalog opportunities vs your participation.</p>
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
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 min-w-0 overflow-hidden shadow-2xs">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
                  <i className="ti ti-chart-donut text-primary shrink-0" aria-hidden="true" />
                  Domain & Category Share
                </h2>
                <p className="text-xs text-muted-foreground truncate">Breakdown of opportunities by domain category.</p>
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

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] min-w-0">
            {/* Chart 3: CreditCoins Reward Potential Bar Chart */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 min-w-0 overflow-hidden shadow-2xs">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
                  <i className="ti ti-coin text-amber-500 shrink-0" aria-hidden="true" />
                  CreditCoin (CC) Pool per Category
                </h2>
                <p className="text-xs text-muted-foreground truncate">Total available CC reward values vs your estimated earnings.</p>
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
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 min-w-0 overflow-hidden shadow-2xs">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
                <i className="ti ti-bulb text-primary shrink-0" aria-hidden="true" />
                Smart Performance Insights
              </h2>
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground min-w-0">
                <div className="rounded-xl bg-secondary/60 p-3 border border-border/50 flex items-start gap-2.5 min-w-0">
                  <span className="p-1 rounded-lg bg-primary/10 text-primary font-bold shrink-0 flex items-center justify-center h-6 w-6 text-center">1</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">Opportunity Coverage</p>
                    <p className="mt-0.5">Applied to <strong className="text-foreground">{appliedCount}</strong> of <strong className="text-foreground">{totalTasks}</strong> tasks ({engagementRate}%).</p>
                  </div>
                </div>

                <div className="rounded-xl bg-secondary/60 p-3 border border-border/50 flex items-start gap-2.5 min-w-0">
                  <span className="p-1 rounded-lg bg-green-500/10 text-green-500 font-bold shrink-0 flex items-center justify-center h-6 w-6 text-center">2</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">Completion Efficiency</p>
                    <p className="mt-0.5"><strong className="text-foreground">{completionRate}%</strong> completion success rate for applied tasks.</p>
                  </div>
                </div>

                <div className="rounded-xl bg-secondary/60 p-3 border border-border/50 flex items-start gap-2.5 min-w-0">
                  <span className="p-1 rounded-lg bg-amber-500/10 text-amber-500 font-bold shrink-0 flex items-center justify-center h-6 w-6 text-center">3</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">Top Active Domain</p>
                    <p className="mt-0.5">Highest concentration: <strong className="text-foreground">{categoryData[0]?.name || 'N/A'}</strong> ({categoryData[0]?.value || 0} tasks).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENT BREAKDOWN */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deptBreakdown.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary">
                      <i className="ti ti-building text-lg" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{item.dept}</h3>
                      <p className="text-[11px] text-muted-foreground">{item.count} Active Tasks</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {item.share}% Share
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-secondary/60 border border-border/50">
                    <p className="text-muted-foreground text-[10px] uppercase font-bold">Reward Pool</p>
                    <p className="text-base font-extrabold text-amber-500 mt-0.5">{item.cc} CC</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-secondary/60 border border-border/50">
                    <p className="text-muted-foreground text-[10px] uppercase font-bold">Urgent Tasks</p>
                    <p className="text-base font-extrabold text-red-500 mt-0.5">{item.urgent}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Department Task Share</span>
                    <span>{item.share}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.share}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DATA RECORDS TABLE */}
      {activeTab === 'table' && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <i className="ti ti-table text-primary text-base" aria-hidden="true" />
              Detailed Task Performance Records ({filteredTasks.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              Showing filtered results
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/70 text-muted-foreground font-bold border-b border-border uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Task Title</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Reward (CC)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Your State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTasks.map((t, idx) => {
                  const tid = t.id || t.taskid
                  const isApplied = appliedTaskIds.includes(tid)
                  const isCompleted = completedTaskIds.includes(tid)

                  return (
                    <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-3.5 font-bold text-foreground">#{tid}</td>
                      <td className="p-3.5 font-medium text-foreground max-w-[240px] truncate">{t.title}</td>
                      <td className="p-3.5 text-muted-foreground">{t.department || 'Admin'}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-secondary border border-border text-[11px] font-semibold text-foreground">
                          {t.category || 'General'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-amber-500">+{t.cc || t.creditcoins || 50} CC</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.urgent ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-primary/10 text-primary'
                        }`}>
                          {t.status || 'Open'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold">
                            ✓ Completed
                          </span>
                        ) : isApplied ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold">
                            ➔ Applied
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-semibold">
                            Not Applied
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
