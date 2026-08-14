'use client'

import { useDashboard } from '@/app/dashboard/layout'

export default function TaskCard({ task, showMarkComplete = false }) {
  const { appliedTaskIds, completedTaskIds, handleApply, handleUnapply, handleMarkComplete } = useDashboard()

  const isApplied = appliedTaskIds.includes(task.id)
  const isCompleted = completedTaskIds.includes(task.id)

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-muted">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{task.department}</span>
              {task.urgent && (
                <span className="rounded bg-urgent px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                  Urgent
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Deadline · {task.deadline}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-coin">
            <i className="ti ti-coin text-sm" aria-hidden="true"></i>
            {task.cc} CC
          </span>
        </div>
      </div>

      <div className="px-4 py-3">
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">{task.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {task.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <i className="ti ti-clock text-sm" aria-hidden="true"></i>
          Due {task.deadline}
        </span>
        {isCompleted ? (
          <span className="rounded-full px-4 py-1.5 text-xs font-semibold border border-accent bg-accent/10 text-accent flex items-center gap-1">
            <i className="ti ti-check text-sm" aria-hidden="true"></i>
            Completed
          </span>
        ) : isApplied ? (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full px-4 py-1.5 text-xs font-semibold border border-accent bg-accent/10 text-accent flex items-center gap-1">
              <i className="ti ti-check text-sm" aria-hidden="true"></i>
              Applied
            </span>
            <button
              type="button"
              onClick={() => handleUnapply(task.id)}
              className="rounded-full px-4 py-1.5 text-xs font-semibold border border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
            >
              Unapply
            </button>
            {showMarkComplete && (
              <button
                type="button"
                onClick={() => handleMarkComplete(task.id)}
                className="rounded-full px-4 py-1.5 text-xs font-semibold border border-green-600 bg-green-600 text-white hover:bg-green-700"
              >
                Mark Complete
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleApply(task.id)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold border border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Apply
          </button>
        )}
      </div>
    </article>
  )
}
