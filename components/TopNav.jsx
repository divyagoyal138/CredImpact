'use client'

const NAV_LINKS = [
  { id: 'explore', label: 'Explore', icon: 'ti-home' },
  { id: 'my-tasks', label: 'My tasks', icon: 'ti-list-check' },
  { id: 'events', label: 'Events', icon: 'ti-calendar-event' },
  { id: 'portfolio', label: 'Portfolio', icon: 'ti-briefcase' },
]

function getInitials(name) {
  if (!name) return '??'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function TopNav({
  user,
  activeNav = 'explore',
  onNavClick,
  searchQuery = '',
  onSearchChange,
}) {
  const initials = getInitials(user?.name)
  const ccBalance = user?.ccBalance ?? 0

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-[52px] max-w-[1128px] items-center gap-4 px-4">
        <div className="shrink-0 text-[20px] font-semibold tracking-tight text-foreground">
          Cred<span className="text-primary">Impact</span>
        </div>

        <div className="relative hidden min-w-0 flex-1 sm:block">
          <i
            className="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search tasks, skills, departments"
            className="h-9 w-full max-w-[280px] rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 lg:max-w-none"
          />
        </div>

        <nav className="ml-auto flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = activeNav === link.id
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavClick?.(link.id)}
                className={`flex min-w-[64px] flex-col items-center rounded-md px-2 py-1 transition-colors ${isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <i
                  className={`ti ${link.icon} text-[20px] ${isActive ? 'text-primary' : ''}`}
                  aria-hidden="true"
                />
                <span
                  className={`mt-0.5 hidden text-[11px] leading-none xl:block ${isActive ? 'font-semibold text-foreground' : ''
                    }`}
                >
                  {link.label}
                </span>
                {isActive && (
                  <span className="mt-1 hidden h-0.5 w-full max-w-[64px] rounded-full bg-primary xl:block" />
                )}
              </button>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 border-l border-border pl-3">
          <span className="hidden items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-coin md:flex">
            <i className="ti ti-coin text-sm" aria-hidden="true" />
            {ccBalance} CC
          </span>
          <button
            type="button"
            className="relative flex h-9 w-9 flex-col items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label="Notifications"
          >
            <i className="ti ti-bell text-[20px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onNavClick?.('profile')}
            className="flex flex-col items-center rounded-md px-1.5 py-0.5 hover:bg-background transition-colors cursor-pointer"
            title={`View profile for ${user?.name || 'User'}`}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-primary ring-1 ring-primary/20">
              {initials}
            </div>
            <span className="mt-0.5 hidden text-[11px] text-muted-foreground xl:block font-medium">Me</span>
          </button>
        </div>
      </div>
    </header>
  )
}
