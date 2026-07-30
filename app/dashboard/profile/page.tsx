'use client'

import { useState, useEffect } from 'react'
import { useDashboard } from '../layout'
import { updateStudentProfile } from '@/lib/api'

function getInitials(name: string) {
  if (!name) return '??'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function ProfilePage() {
  const { user, portfolio, appliedTaskIds, completedTaskIds, tasks, refreshData } = useDashboard()
  
  const [isEditing, setIsEditing] = useState(false)
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [portfolioLink, setPortfolioLink] = useState(user?.portfolioLink || `https://portfolio.example.com/${user?.uid || user?.studentid || ''}`)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setPortfolioLink(user.portfolioLink || `https://portfolio.example.com/${user.uid || user.studentid || ''}`)
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    const studentUid = user.uid || user.studentid
    if (!studentUid) return

    setSaving(true)
    setSaveMessage('')

    try {
      await updateStudentProfile(studentUid, {
        email,
        phone,
        portfolioLink,
      })
      await refreshData()
      setIsEditing(false)
      setSaveMessage('Profile updated successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: any) {
      setSaveMessage(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const initials = getInitials(user?.name)
  const formattedDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'July 2026'

  const totalCC = user?.ccBalance ?? user?.creditcoins ?? 100
  const completedCount = completedTaskIds?.length ?? user?.completedTasks ?? 0
  const appliedCount = appliedTaskIds?.length ?? 0

  return (
    <div className="space-y-4">
      {/* Header Profile Banner */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-secondary to-accent/20 border-b border-border relative" />
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 gap-4">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-secondary text-2xl font-bold text-primary shadow-md">
                {initials}
              </div>
              <div className="mb-1">
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {user?.name || 'Student Name'}
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Student
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  UID: <span className="font-semibold text-foreground">{user?.uid || user?.studentid}</span> · {user?.department}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors flex items-center gap-1.5"
                >
                  <i className="ti ti-edit text-sm" aria-hidden="true" />
                  Edit Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {saveMessage && (
            <div className="mt-4 rounded-lg bg-secondary/80 border border-primary/20 px-3.5 py-2 text-xs font-medium text-primary">
              {saveMessage}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-coin">
            <i className="ti ti-coin text-lg" aria-hidden="true" />
            <span className="text-xl font-bold">{totalCC}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground font-medium font-medium">CC Balance</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-xl font-bold text-foreground">{completedCount}</div>
          <p className="mt-1 text-xs text-muted-foreground font-medium font-medium font-medium">Completed Tasks</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-xl font-bold text-foreground">{appliedCount}</div>
          <p className="mt-1 text-xs text-muted-foreground font-medium font-medium font-medium">Applied Tasks</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-xl font-bold text-foreground">{user?.semester || 5}</div>
          <p className="mt-1 text-xs text-muted-foreground font-medium font-medium font-medium">Current Semester</p>
        </div>
      </div>

      {/* Information Grid & Details */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <i className="ti ti-id text-primary text-base" aria-hidden="true" />
            Student Information
          </h2>
          <span className="text-xs text-muted-foreground">College: <strong className="text-foreground">{user?.collegeCode || user?.collegecode || 'KJSCE'}</strong></span>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Student ID / UID
              </label>
              <div className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground">
                {user?.uid || user?.studentid || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                College Code
              </label>
              <div className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground">
                {user?.collegeCode || user?.collegecode || 'KJSCE'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              ) : (
                <div className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground">
                  {user?.email || 'student@kjsce.edu'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              ) : (
                <div className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground">
                  {user?.phone || '9876543210'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Department
              </label>
              <div className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground">
                {user?.department || user?.branch || 'Computer Science'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Member Since
              </label>
              <div className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground">
                {formattedDate}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Portfolio Link
            </label>
            {isEditing ? (
              <input
                type="url"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="https://portfolio.example.com/username"
                className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3.5 py-2 text-sm">
                <a
                  href={user?.portfolioLink || `https://portfolio.example.com/${user?.uid || user?.studentid || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium truncate flex items-center gap-1.5"
                >
                  <i className="ti ti-link text-xs" aria-hidden="true" />
                  {user?.portfolioLink || `https://portfolio.example.com/${user?.uid || user?.studentid || ''}`}
                </a>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Completed Tasks & Portfolio Items */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <i className="ti ti-briefcase text-primary text-base" aria-hidden="true" />
            Portfolio & Completed Tasks ({portfolio?.length || 0})
          </h2>
        </div>

        <div className="p-4 space-y-2.5">
          {portfolio && portfolio.length > 0 ? (
            portfolio.map((item: any, index: number) => (
              <div key={item.id || index} className="rounded-lg border border-border bg-background p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-coin">
                    +{item.ccEarned || item.cc || 0} CC
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-2">
                  <span>Completed on {item.date || 'Recent'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <i className="ti ti-briefcase-off text-2xl text-muted mx-auto" aria-hidden="true" />
              <p className="mt-2 text-xs text-muted-foreground font-medium">No completed tasks in portfolio yet</p>
              <p className="mt-0.5 text-[11px] text-muted">Complete tasks from your dashboard to display them here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
