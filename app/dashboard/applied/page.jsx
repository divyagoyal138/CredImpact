'use client'

import TaskCard from '@/components/TaskCard'
import { useDashboard } from '../layout'

export default function AppliedPage() {
  const { tasks, appliedTaskIds, completedTaskIds } = useDashboard()
  const appliedTasks = tasks.filter(task => 
    appliedTaskIds.includes(task.id) && 
    !completedTaskIds.includes(task.id) && 
    task.status?.toLowerCase() !== 'completed'
  )

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">My Applied Tasks</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {appliedTasks.length} task{appliedTasks.length === 1 ? '' : 's'} applied
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {appliedTasks.length > 0 ? (
          appliedTasks.map(task => <TaskCard key={task.id} task={task} showMarkComplete={true} />)
        ) : (
          <div className="rounded-lg border border-border bg-card px-4 py-10 text-center">
            <i className="ti ti-send mx-auto text-2xl text-muted" aria-hidden="true"></i>
            <p className="mt-2 text-sm font-medium text-foreground">No applied tasks yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start exploring tasks to apply!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
