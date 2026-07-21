'use client'

import { useDashboard } from '../layout'

export default function MyPortfolioPage() {
  const { portfolio } = useDashboard()

  const totalCC = portfolio.reduce((sum, item) => sum + item.ccEarned, 0)

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-card mb-3">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">My Portfolio</h1>
        </div>
        <div className="px-4 py-4 flex gap-4">
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground">Total Tasks Completed</p>
            <p className="text-2xl font-bold text-foreground">{portfolio.length}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground">Total CC Earned</p>
            <p className="text-2xl font-bold text-coin">{totalCC}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {portfolio.map(item => (
          <article key={item.id} className="overflow-hidden rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-coin font-semibold">
                    +{item.ccEarned} CC
                  </span>
                </div>
                <h3 className="mt-2 text-[15px] font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">{item.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <i className="ti ti-calendar" aria-hidden="true"></i>
                    {item.date}
                  </span>
                  {item.tags && item.tags.map(tag => (
                    <span key={tag} className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
