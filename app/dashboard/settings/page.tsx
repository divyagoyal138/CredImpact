'use client'

import { useTheme, Theme } from '@/lib/theme-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SettingsPage() {
  const { theme, effectiveTheme, setTheme } = useTheme()
  const router = useRouter()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [publicProfile, setPublicProfile] = useState(true)

  const handleLogout = () => {
    localStorage.removeItem('credimpact_user')
    localStorage.removeItem('campuslink_user')
    router.push('/login')
  }

  const THEME_OPTIONS: Array<{
    id: Theme
    name: string
    badge?: string
    icon: string
    description: string
    swatches: { bg: string; card: string; accent: string }
  }> = [
    {
      id: 'dark',
      name: 'Midnight Obsidian',
      badge: 'Recommended',
      icon: 'ti-moon-stars',
      description: 'Ultra-sleek dark slate background with vibrant glowing gold & emerald accents.',
      swatches: { bg: '#0A0E17', card: '#141C2B', accent: '#F59E0B' },
    },
    {
      id: 'dark-warm',
      name: 'Warm Espresso',
      badge: 'Dark Academia',
      icon: 'ti-coffee',
      description: 'Rich espresso charcoal background with warm antique gold highlights.',
      swatches: { bg: '#161412', card: '#231F1C', accent: '#E5B869' },
    },
    {
      id: 'light',
      name: 'Classic Ivory',
      icon: 'ti-sun',
      description: 'Soft antique ivory background with deep chestnut and forest moss accents.',
      swatches: { bg: '#EDE8DC', card: '#FAF7F2', accent: '#8B2C1F' },
    },
    {
      id: 'system',
      name: 'System Auto',
      icon: 'ti-device-desktop',
      description: 'Automatically matches your computer or phone operating system preference.',
      swatches: { bg: 'linear-gradient(135deg, #0A0E17 50%, #EDE8DC 50%)', card: '#141C2B', accent: '#F59E0B' },
    },
  ]

  const getEffectiveLabel = () => {
    if (theme === 'system') {
      return `System Auto (${effectiveTheme === 'light' ? 'Active: Light' : 'Active: Midnight Obsidian'})`
    }
    if (theme === 'dark') return 'Midnight Obsidian (Dark)'
    if (theme === 'dark-warm') return 'Warm Espresso (Dark Academia)'
    return 'Classic Ivory (Light)'
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="overflow-hidden rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <i className="ti ti-settings text-primary text-xl" aria-hidden="true" />
              Settings & Preferences
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Customize your app theme, account notifications, and user preferences
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-secondary px-3 py-1 text-xs font-semibold text-primary">
            <i className="ti ti-palette text-sm" aria-hidden="true" />
            {theme === 'system' ? 'System Theme' : 'Custom Theme'}
          </span>
        </div>
      </div>

      {/* Theme & Appearance Section */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <i className="ti ti-palette text-primary text-base" aria-hidden="true" />
            Appearance & Theme
          </h2>
          <span className="text-xs text-muted-foreground">
            Current: <strong className="text-foreground">{getEffectiveLabel()}</strong>
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {THEME_OPTIONS.map((option) => {
              const isSelected = theme === option.id

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className={`group relative text-left rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-secondary/70 shadow-sm ring-1 ring-primary/20'
                      : 'border-border bg-background hover:border-muted-foreground/40 hover:bg-secondary/30'
                  }`}
                >
                  {/* Option Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors ${
                          isSelected
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border bg-card text-muted-foreground group-hover:text-foreground'
                        }`}
                      >
                        <i className={`ti ${option.icon}`} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-none">
                          {option.name}
                        </p>
                        {option.badge && (
                          <span className="mt-1 inline-block rounded bg-primary/15 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                            {option.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Radio Checkbox */}
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card'
                      }`}
                    >
                      {isSelected && <i className="ti ti-check text-xs stroke-[3]" aria-hidden="true" />}
                    </div>
                  </div>

                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>

                  {/* Swatch Previews */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-border/60 pt-2.5">
                    <span className="text-[11px] text-muted-foreground font-medium">Palette Swatches</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-4 w-4 rounded-full border border-border shadow-xs"
                        style={{ background: option.swatches.bg }}
                        title="Background color"
                      />
                      <span
                        className="h-4 w-4 rounded-full border border-border shadow-xs"
                        style={{ background: option.swatches.card }}
                        title="Card surface color"
                      />
                      <span
                        className="h-4 w-4 rounded-full border border-border shadow-xs"
                        style={{ background: option.swatches.accent }}
                        title="Primary accent color"
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Preferences & Account Section */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <i className="ti ti-user-cog text-primary text-base" aria-hidden="true" />
            Account Preferences
          </h2>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3.5">
            <div>
              <p className="text-sm font-semibold text-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receive updates when your task applications are accepted or completed
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                emailNotifications ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  emailNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3.5">
            <div>
              <p className="text-sm font-semibold text-foreground">Public Campus Profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allow fellow students and campus organizers to view your skill portfolio
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPublicProfile(!publicProfile)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                publicProfile ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  publicProfile ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">Session</p>
              <p className="text-[11px] text-muted-foreground">Log out of CredImpact on this browser</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-white hover:bg-destructive/90 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ti ti-logout text-sm" aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
