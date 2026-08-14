'use client'

import { useMemo, useState } from 'react'
import TaskCard from '@/components/TaskCard'
import { TASKS, useDashboard } from './layout'

const FILTERS = ['All', 'Design', 'Coding', 'Content Writing', 'Event Help', 'Data Entry']

export default function DiscoverPage() {
  const { tasks, searchQuery, completedTaskIds } = useDashboard()
  const [activeFilter, setActiveFilter] = useState('All')

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Exclude completed tasks so they only appear under Completed
      if (completedTaskIds.includes(task.id) || task.status?.toLowerCase() === 'completed') {
        return false
      }
      const matchesFilter = activeFilter === 'All' || task.category === activeFilter
      if (!matchesFilter) return false
      if (!searchQuery.trim()) return true
      const inTitle = task.title.toLowerCase().includes(searchQuery.toLowerCase())
      const inTags = task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      return inTitle || inTags
    })
  }, [activeFilter, searchQuery, tasks, completedTaskIds])

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">Discover Tasks</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'} available
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-muted-foreground hover:border-muted hover:text-foreground'
                }`}
              >
                {filter}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <div className="rounded-lg border border-border bg-card px-4 py-10 text-center">
            <i className="ti ti-search-off mx-auto text-2xl text-muted" aria-hidden="true"></i>
            <p className="mt-2 text-sm font-medium text-foreground">No tasks found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your filters!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
