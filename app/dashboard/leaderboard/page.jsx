'use client'

const LEADERBOARD = [
  { rank: 1, name: 'Priya Mehta', branch: 'IT', cc: 412, avatarClass: 'bg-secondary text-primary' },
  { rank: 2, name: 'Arjun Patel', branch: 'ECE', cc: 388, avatarClass: 'bg-background text-muted-foreground' },
  { rank: 3, name: 'Rahul Sharma', branch: 'CSE', cc: 340, highlight: true, avatarClass: 'bg-secondary text-primary' },
  { rank: 4, name: 'Sneha Rao', branch: 'Mech', cc: 295, avatarClass: 'bg-background text-muted-foreground' },
  { rank: 5, name: 'Vikram Singh', branch: 'Civil', cc: 250, avatarClass: 'bg-background text-muted-foreground' },
]

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
  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">
            <i className="ti ti-trophy text-yellow-500 mr-2" aria-hidden="true"></i>
            Leaderboard
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Top contributors this semester</p>
        </div>
        <div className="divide-y divide-border">
          {LEADERBOARD.map(entry => (
            <div
              key={entry.rank}
              className={`flex items-center gap-3 px-4 py-3 ${entry.highlight ? 'bg-secondary/60' : ''}`}
            >
              <span className="text-sm font-bold text-muted-foreground w-6 text-center">
                {entry.rank}
              </span>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${entry.avatarClass}`}>
                {getInitials(entry.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {entry.name}
                  {entry.highlight && <span className="text-xs text-muted-foreground ml-2">(You)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{entry.branch}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-coin">
                <i className="ti ti-coin" aria-hidden="true"></i>
                {entry.cc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
