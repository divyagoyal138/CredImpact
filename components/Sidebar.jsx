'use client'

const SIDEBAR_SECTIONS = [
  {
    label: 'Discover',
    items: [
      { id: 'all-tasks', label: 'All tasks', icon: 'ti-list-check' },
      { id: 'recommended', label: 'Recommended', icon: 'ti-star' },
      { id: 'urgent', label: 'Urgent', icon: 'ti-alert-circle' },
      { id: 'events', label: 'Events', icon: 'ti-calendar-event' },
    ],
  },
  {
    label: 'My activity',
    items: [
      { id: 'applied', label: 'Applied', icon: 'ti-send' },
      { id: 'completed', label: 'Completed', icon: 'ti-circle-check' },
      { id: 'cc-wallet', label: 'CC wallet', icon: 'ti-wallet' },
    ],
  },
  {
    label: 'Profile',
    items: [
      { id: 'profile', label: 'My profile', icon: 'ti-user' },
      { id: 'my-portfolio', label: 'My portfolio', icon: 'ti-briefcase' },
      { id: 'leaderboard', label: 'Leaderboard', icon: 'ti-trophy' },
      { id: 'settings', label: 'Settings', icon: 'ti-settings' },
      { id: 'logout', label: 'Logout', icon: 'ti-logout' },
    ],
  },
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

export default function Sidebar({ user, activeItem = 'all-tasks', onItemClick }) {
  const initials = getInitials(user?.name)

  return (
    <aside className="sticky top-[52px] h-[calc(100vh-52px)] w-[225px] shrink-0 self-start overflow-y-auto">
      <div 
        onClick={() => onItemClick?.('profile')}
        className="overflow-hidden rounded-lg border border-border bg-card cursor-pointer hover:border-muted transition-colors"
      >
        <div className="relative h-14 bg-secondary/60">
          <div className="absolute -bottom-5 left-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-secondary text-sm font-semibold text-primary">
            {initials}
          </div>
        </div>
        <div className="px-4 pb-4 pt-7">
          <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {user?.department || user?.branch}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-coin">
            <i className="ti ti-coin" aria-hidden="true" />
            {user?.ccBalance ?? 0} CC balance
          </div>
        </div>
      </div>

      <nav className="mt-2 overflow-hidden rounded-lg border border-border bg-card py-2">
        {SIDEBAR_SECTIONS.map((section, sectionIndex) => (
          <div key={section.label}>
            {sectionIndex > 0 && <div className="mx-3 my-2 border-t border-border" />}
            <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {section.label}
            </p>
            <ul>
              {section.items.map((item) => {
                const isActive = activeItem === item.id
                const isLogout = item.id === 'logout'

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onItemClick?.(item.id)}
                      className={`flex w-full items-center gap-3 border-l-[3px] px-4 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? 'border-primary bg-secondary/70 font-semibold text-foreground'
                          : 'border-transparent text-muted-foreground hover:bg-background hover:text-foreground'
                      } ${isLogout ? 'text-destructive hover:text-destructive' : ''}`}
                    >
                      <i
                        className={`ti ${item.icon} text-[18px] ${isActive ? 'text-primary' : ''}`}
                        aria-hidden="true"
                      />
                      {item.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
