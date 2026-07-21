'use client'
const EVENTS = [
  {
    id: 1,
    title: 'Tech Fest 2025',
    description: 'Annual tech festival with competitions, workshops, and guest lectures',
    date: 'Dec 10 - Dec 12, 2024',
    location: 'College Auditorium',
    organizer: 'CSE Department',
  },
  {
    id: 2,
    title: 'Placement Drive - ABC Corp',
    description: 'Campus placement drive for final year students',
    date: 'Dec 5, 2024',
    location: 'Placement Cell',
    organizer: 'Placement Cell',
  },
  {
    id: 3,
    title: 'Workshop on Web Development',
    description: 'Hands-on workshop on modern web technologies',
    date: 'Nov 30, 2024',
    location: 'Lab 201',
    organizer: 'IT Department',
  },
]
export default function EventsPage() {
  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">Upcoming Events</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {EVENTS.length} event{EVENTS.length === 1 ? '' : 's'} coming up!
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {EVENTS.map(event => (
          <article key={event.id} className="overflow-hidden rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-semibold text-foreground">{event.title}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">{event.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <i className="ti ti-calendar" aria-hidden="true"></i>
                    {event.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="ti ti-map-pin" aria-hidden="true"></i>
                    {event.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="ti ti-building" aria-hidden="true"></i>
                    {event.organizer}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
