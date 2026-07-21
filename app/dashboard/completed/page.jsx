'use client'

import TaskCard from '@/components/TaskCard'
import { useDashboard } from '../layout'

export default function CompletedPage() {
  const { tasks, completedTaskIds } = useDashboard()
  const completedTasks = tasks.filter(task => completedTaskIds.includes(task.id))

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">
            <i className="ti ti-circle-check text-accent mr-2" aria-hidden="true"></i>
            Completed Tasks
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completedTasks.length} task{completedTasks.length === 1 ? '' : 's'} completed
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {completedTasks.length > 0 ? (
          completedTasks.map(task => <TaskCard key={task.id} task={task} />)
        ) : (
          <div className="rounded-lg border border-border bg-card px-4 py-10 text-center">
            <i className="ti ti-circle-check mx-auto text-2xl text-muted" aria-hidden="true"></i>
            <p className="mt-2 text-sm font-medium text-foreground">No completed tasks yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Complete tasks to earn CC!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
