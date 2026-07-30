'use client'

import { useDashboard } from '@/app/dashboard/layout'

function getInitials(name) {
  if (!name) return '??'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function RightPanel() {
  const { user, leaderboard } = useDashboard()

  const list = leaderboard && leaderboard.length > 0 ? leaderboard.slice(0, 4) : [
    { rank: 1, name: 'Dummy Student', cc: 100, id: '2023CSE045' },
    { rank: 2, name: 'Divya Goyal', cc: 100, id: '24BIT020' },
  ]

  const userCc = user?.ccBalance ?? user?.creditcoins ?? 100

  return (
    <aside className="sticky top-[52px] hidden h-[calc(100vh-52px)] w-[300px] shrink-0 self-start overflow-y-auto lg:block">
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Contribution score</p>
        </div>
        <div className="px-4 py-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary">
            <span className="text-xl font-bold text-primary">{userCc}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {user?.department || 'CSE'} Department · Active Contributor
          </p>
        </div>
      </section>

      <section className="mt-2 overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3 flex justify-between items-center">
          <p className="text-sm font-semibold text-foreground">Live Leaderboard</p>
          <span className="text-[10px] text-primary font-medium">Realtime</span>
        </div>
        <ul className="py-1 divide-y divide-border/40">
          {list.map((entry, index) => {
            const isUser = user && (user.uid === entry.id || user.studentid === entry.id)
            return (
              <li
                key={entry.id || index}
                className={`flex items-center gap-2.5 px-4 py-2.5 ${
                  isUser ? 'bg-secondary/60 font-semibold' : ''
                }`}
              >
                <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground">
                  {entry.rank || index + 1}
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-primary">
                  {getInitials(entry.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {entry.name}
                    {isUser && <span className="text-[10px] text-primary font-bold ml-1">(You)</span>}
                  </p>
                  <p className="text-xs text-coin">{entry.cc ?? 100} CC</p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-2 overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Recent activity</p>
        </div>
        <ul className="divide-y divide-border">
          <li className="flex items-start gap-2.5 px-4 py-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
            <span className="text-[13px] leading-snug text-muted-foreground">Database synced · Realtime active</span>
          </li>
          <li className="flex items-start gap-2.5 px-4 py-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
            <span className="text-[13px] leading-snug text-muted-foreground">Tasks & CC balance live on PostgreSQL</span>
          </li>
        </ul>
      </section>

      <div className="mt-3 rounded-lg border border-border bg-card px-4 py-3">
        <p className="text-[11px] leading-relaxed text-muted">
          Earn your reputation before you graduate
        </p>
      </div>
    </aside>
  )
}
