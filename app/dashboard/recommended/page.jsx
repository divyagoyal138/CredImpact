'use client'

import TaskCard from '@/components/TaskCard'
import { useDashboard } from '../layout'

export default function RecommendedPage() {
  const { tasks, completedTaskIds } = useDashboard()
  const recommendedTasks = tasks.filter(task => 
    !completedTaskIds.includes(task.id) && 
    task.status?.toLowerCase() !== 'completed' &&
    (task.category === 'Design' || task.category === 'Coding')
  )

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">Recommended for You</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Based on your interests
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {recommendedTasks.map(task => <TaskCard key={task.id} task={task} />)}
      </div>
    </div>
  )
}
