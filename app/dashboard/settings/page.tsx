'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedUser = localStorage.getItem('campuslink_user')
    if (!storedUser) {
      router.push('/login')
      return
    }
    isLoggedIn === false && setIsLoggedIn(true)
    
    const storedTheme = (localStorage.getItem('campuslink_theme') as 'light' | 'dark') || 'light'
    setThemeState(storedTheme)
    setLoading(false)
  }, [router])

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme)
    localStorage.setItem('campuslink_theme', newTheme)
    const htmlElement = document.documentElement
    if (newTheme === 'dark') {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('campuslink_user')
    router.push('/login')
  }

  if (loading || !isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar px-6 py-8 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold">C</span>
          </div>
          <span className="font-bold text-sidebar-foreground">CampusLink</span>
        </div>

        <nav className="space-y-2">
          {[
            { name: 'Dashboard', href: '/dashboard' },
            { name: 'Tasks', href: '#' },
            { name: 'Messages', href: '#' },
            { name: 'Profile', href: '#' },
            { name: 'Settings', href: '/dashboard/settings', active: true },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              {item.name}
            </a>
          ))}
        </nav>

        <div className="mt-8 border-t border-sidebar-border pt-8">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your preferences</p>
            </div>
            <button
              onClick={handleLogout}
              className="md:hidden px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto px-6 py-8 md:px-8">
          <div className="max-w-2xl">
            {/* Appearance Section */}
            <div className="rounded-xl bg-card border border-border p-6 shadow-sm mb-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Appearance</h2>

              {/* Theme Selection */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'light',
                        name: 'Light',
                        icon: '☀️',
                        description: 'Soft beige background with navy accents',
                      },
                      {
                        id: 'dark',
                        name: 'Dark',
                        icon: '🌙',
                        description: 'Dark background with gold accents',
                      },
                    ].map((themeOption) => (
                      <button
                        key={themeOption.id}
                        onClick={() => setTheme(themeOption.id as 'light' | 'dark')}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          theme === themeOption.id
                            ? 'border-accent bg-accent/10'
                            : 'border-border hover:border-muted-foreground/50'
                        }`}
                      >
                        <div className="text-2xl mb-2">{themeOption.icon}</div>
                        <p className="font-semibold text-foreground text-sm">{themeOption.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {themeOption.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Theme Display */}
                <div className="mt-6 p-4 rounded-lg bg-secondary border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Current Theme</p>
                  <p className="text-lg font-semibold text-foreground capitalize">
                    {theme === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div className="rounded-xl bg-card border border-border p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-6">Account</h2>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Email Notifications</p>
                  <p className="text-foreground font-medium">Enabled</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Privacy Settings</p>
                  <p className="text-foreground font-medium">Public Profile</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full mt-6 px-4 py-2.5 rounded-lg bg-destructive text-primary-foreground font-semibold hover:bg-destructive/90 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
