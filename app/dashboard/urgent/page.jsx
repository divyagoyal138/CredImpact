'use client'

import TaskCard from '@/components/TaskCard'
import { useDashboard } from '../layout'

export default function UrgentPage() {
  const { tasks, completedTaskIds } = useDashboard()
  const urgentTasks = tasks.filter(task => 
    !completedTaskIds.includes(task.id) && 
    task.status?.toLowerCase() !== 'completed' && 
    task.urgent
  )

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">
            <i className="ti ti-alert-circle text-destructive mr-2" aria-hidden="true"></i>
            Urgent Tasks
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {urgentTasks.length} urgent task{urgentTasks.length === 1 ? '' : 's'} that need immediate attention!
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {urgentTasks.length > 0 ? (
          urgentTasks.map(task => <TaskCard key={task.id} task={task} />)
        ) : (
          <div className="rounded-lg border border-border bg-card px-4 py-10 text-center">
            <i className="ti ti-alert-circle mx-auto text-2xl text-muted" aria-hidden="true"></i>
            <p className="mt-2 text-sm font-medium text-foreground">No urgent tasks</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No tasks need immediate attention right now!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
