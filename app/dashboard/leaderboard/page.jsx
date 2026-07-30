'use client'

import { useDashboard } from '../layout'

function getInitials(name) {
  if (!name) return '??'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function LeaderboardPage() {
  const { user, leaderboard } = useDashboard()

  const list = leaderboard && leaderboard.length > 0 ? leaderboard : [
    { rank: 1, name: 'Dummy Student', branch: 'Computer Science', cc: 100, id: '2023CSE045' },
    { rank: 2, name: 'Divya Goyal', branch: 'BSCIT', cc: 100, id: '24BIT020' },
  ]

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">
            <i className="ti ti-trophy text-yellow-500 mr-2" aria-hidden="true"></i>
            Leaderboard
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Top student contributors synced in real-time from database</p>
        </div>
        <div className="divide-y divide-border">
          {list.map((entry, index) => {
            const isUser = user && (user.uid === entry.id || user.studentid === entry.id)
            return (
              <div
                key={entry.id || index}
                className={`flex items-center gap-3 px-4 py-3 ${isUser ? 'bg-secondary/60 font-semibold' : ''}`}
              >
                <span className="text-sm font-bold text-muted-foreground w-6 text-center">
                  {entry.rank || index + 1}
                </span>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
                  {getInitials(entry.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {entry.name}
                    {isUser && <span className="text-xs text-primary font-bold ml-2">(You)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.branch || entry.department}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-coin">
                  <i className="ti ti-coin" aria-hidden="true"></i>
                  {entry.cc ?? entry.creditcoins ?? 100} CC
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
