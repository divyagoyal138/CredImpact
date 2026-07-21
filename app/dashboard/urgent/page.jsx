'use client'

import TaskCard from '@/components/TaskCard'
import { useDashboard } from '../layout'

export default function UrgentPage() {
  const { tasks } = useDashboard()
  const urgentTasks = tasks.filter(task => task.urgent)

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">
            <i className="ti ti-alert-circle text-destructive mr-2" aria-hidden="true"></i>
            Urgent Tasks
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tasks that need immediate attention!
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {urgentTasks.map(task => <TaskCard key={task.id} task={task} />)}
      </div>
    </div>
  )
}
