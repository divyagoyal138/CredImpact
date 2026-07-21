'use client'

const LEADERBOARD = [
  { rank: 1, name: 'Priya Mehta', initials: 'PM', cc: 412, avatarClass: 'bg-secondary text-primary' },
  { rank: 2, name: 'Arjun Patel', initials: 'AP', cc: 388, avatarClass: 'bg-background text-muted-foreground' },
  {
    rank: 3,
    name: 'Rahul Sharma',
    initials: 'RS',
    cc: 340,
    highlight: true,
    avatarClass: 'bg-secondary text-primary',
  },
  { rank: 4, name: 'Sneha Rao', initials: 'SR', cc: 295, avatarClass: 'bg-urgent text-destructive' },
]

const RECENT_ACTIVITY = [
  'Task approved · 20 CC credited',
  'New urgent task in CSE',
  'Event slot confirmed · Dec 5',
]

export default function RightPanel() {
  return (
    <aside className="sticky top-[52px] hidden h-[calc(100vh-52px)] w-[300px] shrink-0 self-start overflow-y-auto lg:block">
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Contribution score</p>
        </div>
        <div className="px-4 py-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary">
            <span className="text-xl font-bold text-primary">84</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Top 12% in CSE</p>
        </div>
      </section>

      <section className="mt-2 overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Leaderboard this week</p>
        </div>
        <ul className="py-1">
          {LEADERBOARD.map((entry) => (
            <li
              key={entry.rank}
              className={`flex items-center gap-2.5 px-4 py-2.5 ${
                entry.highlight ? 'bg-secondary/60' : ''
              }`}
            >
              <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground">
                {entry.rank}
              </span>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${entry.avatarClass}`}
              >
                {entry.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{entry.name}</p>
                <p className="text-xs text-coin">{entry.cc} CC</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-2 overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Recent activity</p>
        </div>
        <ul className="divide-y divide-border">
          {RECENT_ACTIVITY.map((activity) => (
            <li key={activity} className="flex items-start gap-2.5 px-4 py-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span className="text-[13px] leading-snug text-muted-foreground">{activity}</span>
            </li>
          ))}
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
