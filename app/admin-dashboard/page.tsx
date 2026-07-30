'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getTasks, createTask, getAdminDetails, getAdminApplications, updateApplicationStatus } from '@/lib/api'

type Task = {
  id: number
  title: string
  description: string
  department: string
  cc: number
  deadline: string
  tags: string[]
  urgent: boolean
  category: string
  applicants: string[]
  status: 'open' | 'in-progress' | 'completed'
  createdby?: string
}

type ApplicationItem = {
  applicationID: number
  studentID: string
  name: string
  email: string
  taskID: number
  title: string
  status: string
  appliedDate: string
}

function getInitials(name?: string) {
  if (!name) return 'WR'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'tasks' | 'applicants'>('tasks')
  const [showAddTask, setShowAddTask] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    department: 'Computer Science',
    cc: 50,
    deadline: '',
    tags: [],
    urgent: false,
    category: 'Coding',
  })
  const [tagInput, setTagInput] = useState('')

  const fetchDashboardData = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('credimpact_user')
      const parsedUser = storedUser ? JSON.parse(storedUser) : null
      const adminId = parsedUser?.uid || parsedUser?.adminid || 'ADM001'

      const [apiTasks, apiApps] = await Promise.all([
        getTasks().catch(() => []),
        getAdminApplications(adminId).catch(() => [])
      ])

      if (Array.isArray(apiTasks)) {
        setTasks(apiTasks)
      }
      if (Array.isArray(apiApps)) {
        setApplications(apiApps)
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err)
    }
  }, [])

  useEffect(() => {
    const storedUser = localStorage.getItem('credimpact_user')
    if (!storedUser) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)
      if (parsedUser.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUser(parsedUser)

      // Fetch fresh admin details if needed
      const adminId = parsedUser.uid || parsedUser.adminid
      if (adminId) {
        getAdminDetails(adminId)
          .then((freshAdmin) => {
            if (freshAdmin) {
              const updated = { ...parsedUser, ...freshAdmin }
              setUser(updated)
              localStorage.setItem('credimpact_user', JSON.stringify(updated))
            }
          })
          .catch(() => null)
      }
    } catch {
      router.push('/login')
      return
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!loading && user) {
      fetchDashboardData()
      const interval = setInterval(() => {
        fetchDashboardData()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [loading, user, fetchDashboardData])

  const handleLogout = () => {
    localStorage.removeItem('credimpact_user')
    router.push('/login')
  }

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.description) {
      return
    }

    setIsSubmitting(true)

    try {
      const adminId = user?.uid || user?.adminid || 'ADM001'
      const deadlineStr = newTask.deadline || '2026-08-30'

      await createTask({
        title: newTask.title,
        description: newTask.description,
        creditcoins: newTask.cc || 50,
        deadline: deadlineStr,
        createdby: adminId,
      })

      await fetchDashboardData()

      setShowAddTask(false)
      setNewTask({
        title: '',
        description: '',
        department: 'Computer Science',
        cc: 50,
        deadline: '',
        tags: [],
        urgent: false,
        category: 'Coding',
      })
      setTagInput('')
    } catch (err) {
      console.error('Error creating task:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() && !newTask.tags?.includes(tagInput.trim())) {
      setNewTask({
        ...newTask,
        tags: [...(newTask.tags || []), tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTask({
      ...newTask,
      tags: newTask.tags?.filter(tag => tag !== tagToRemove),
    })
  }

  const handleApplicationAction = async (applicationId: number, status: 'Approved' | 'Rejected') => {
    setActionLoadingId(applicationId)
    try {
      await updateApplicationStatus(applicationId, status)
      await fetchDashboardData()
    } catch (err) {
      console.error(`Error processing ${status} action:`, err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const adminName = user?.name || 'Wilson Rao'
  const adminId = user?.uid || user?.adminid || 'ADM001'
  const collegeCode = user?.collegeCode || user?.collegecode || 'JHC'
  const initials = getInitials(adminName)
  const pendingAppsCount = applications.filter(a => a.status === 'Pending').length

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading Admin Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-[56px] max-w-[1200px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="text-[20px] font-bold tracking-tight text-foreground">
              Cred<span className="text-primary">Impact</span>
            </div>
            <span className="rounded-md bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 bg-secondary/60 rounded-lg px-3 py-1.5 border border-border">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-bold text-foreground leading-tight">
                  {adminName}
                </span>
                <span className="block text-[10px] text-muted-foreground leading-tight">
                  ID: {adminId} · {collegeCode}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-6 space-y-6">
        {/* Admin Welcome Banner */}
        <div className="overflow-hidden rounded-xl border border-border bg-card p-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                <i className="ti ti-shield-check text-base" aria-hidden="true" />
                Authenticated Administrator
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {adminName}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                College Code: <strong className="text-foreground">{collegeCode}</strong> · ID: <strong className="text-foreground">{adminId}</strong> · Email: <strong className="text-foreground">{user?.email || 'WR@jhc.com'}</strong>
              </p>
            </div>

            <button
              onClick={() => setShowAddTask(true)}
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
            >
              <i className="ti ti-plus text-sm" aria-hidden="true" />
              Add New Task
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'tasks'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <i className="ti ti-list-check" aria-hidden="true" />
            Manage Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('applicants')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'applicants'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <i className="ti ti-users" aria-hidden="true" />
            View Applicants ({applications.length})
            {pendingAppsCount > 0 && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                {pendingAppsCount} Pending
              </span>
            )}
          </button>
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {/* Add Task Modal */}
            {showAddTask && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg shadow-xl">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
                    <div>
                      <h3 className="text-base font-bold text-foreground">Create Campus Task</h3>
                      <p className="text-xs text-muted-foreground">Logged as {adminName} ({adminId})</p>
                    </div>
                    <button
                      onClick={() => setShowAddTask(false)}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Task Title</label>
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="e.g. Campus Website Redesign"
                        className="w-full rounded-lg border border-border bg-input px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Description</label>
                      <textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="Provide details about requirements and criteria"
                        rows={3}
                        className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Department</label>
                        <select
                          value={newTask.department}
                          onChange={(e) => setNewTask({ ...newTask, department: e.target.value })}
                          className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                        >
                          <option value="Computer Science">Computer Science</option>
                          <option value="BSCIT">BSCIT</option>
                          <option value="IT Dept">IT Dept</option>
                          <option value="Admin">Admin</option>
                          <option value="Library">Library</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">CC Reward</label>
                        <input
                          type="number"
                          value={newTask.cc}
                          onChange={(e) => setNewTask({ ...newTask, cc: parseInt(e.target.value) || 0 })}
                          placeholder="50"
                          className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Deadline</label>
                        <input
                          type="text"
                          value={newTask.deadline}
                          onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                          placeholder="2026-08-30"
                          className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Category</label>
                        <select
                          value={newTask.category}
                          onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                          className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                        >
                          <option value="Coding">Coding</option>
                          <option value="Design">Design</option>
                          <option value="Content Writing">Content Writing</option>
                          <option value="Event Help">Event Help</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Tags (press Enter to add)
                      </label>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleAddTag}
                        placeholder="e.g. Web Dev, React"
                        className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {newTask.tags?.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary border border-border px-2.5 py-0.5 text-xs text-foreground"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="urgent"
                        checked={newTask.urgent}
                        onChange={(e) => setNewTask({ ...newTask, urgent: e.target.checked })}
                        className="rounded border-border"
                      />
                      <label htmlFor="urgent" className="text-xs font-medium text-foreground">
                        Mark as urgent priority
                      </label>
                    </div>
                    <div className="flex gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowAddTask(false)}
                        className="flex-1 rounded-lg border border-border bg-secondary px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddTask}
                        disabled={isSubmitting}
                        className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? 'Publishing...' : 'Publish Task'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <div key={task.id || task.title} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-muted">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-foreground text-base">{task.title}</h3>
                          {task.urgent && (
                            <span className="rounded-md bg-urgent px-2 py-0.5 text-[10px] font-bold text-destructive">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{task.description}</p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="rounded-md bg-secondary px-2.5 py-1 text-xs text-foreground font-medium">
                            {task.department || 'Computer Science'}
                          </span>
                          <span className="rounded-md bg-secondary px-2.5 py-1 text-xs text-coin font-semibold flex items-center gap-1">
                            <i className="ti ti-coin text-xs" aria-hidden="true" />
                            {task.cc || 50} CC
                          </span>
                          <span className="rounded-md bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                            Deadline: {task.deadline || '2026-08-30'}
                          </span>
                          <span className="text-xs text-muted font-medium ml-auto">
                            Posted by: <strong className="text-foreground">{task.createdby === adminId ? `${adminName} (${adminId})` : task.createdby || adminName}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                          {task.status || 'Open'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-border bg-card p-10 text-center">
                  <i className="ti ti-list-off text-3xl text-muted mx-auto" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium text-foreground">No tasks created yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Click "+ Add New Task" to post your first campus assignment.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applicants Tab */}
        {activeTab === 'applicants' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <i className="ti ti-users-group text-primary text-xl" aria-hidden="true" />
                  Student Applicants Directory
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Showing applications for tasks posted by admin <strong className="text-foreground">{adminName}</strong> ({adminId}).
                </p>
              </div>
              <span className="text-xs text-muted font-medium flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live Sync Active
              </span>
            </div>

            {applications.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/60 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3">App ID</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Student ID</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Task Title</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Applied Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {applications.map((app) => {
                        const isPending = app.status === 'Pending'
                        const isApproved = app.status === 'Approved'
                        const isRejected = app.status === 'Rejected'
                        const isCompleted = app.status === 'Completed'
                        const isProcessing = actionLoadingId === app.applicationID

                        return (
                          <tr key={app.applicationID} className="hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-foreground">
                              #{app.applicationID}
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-foreground">
                              {app.name}
                            </td>
                            <td className="px-4 py-3.5 font-medium text-muted-foreground">
                              {app.studentID}
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">
                              {app.email}
                            </td>
                            <td className="px-4 py-3.5 font-medium text-foreground max-w-[200px] truncate" title={app.title}>
                              {app.title} (ID: #{app.taskID})
                            </td>
                            <td className="px-4 py-3.5">
                              {isPending && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-500">
                                  <i className="ti ti-clock text-xs" aria-hidden="true" />
                                  Pending
                                </span>
                              )}
                              {isApproved && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-500">
                                  <i className="ti ti-check text-xs" aria-hidden="true" />
                                  Approved
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-500">
                                  <i className="ti ti-x text-xs" aria-hidden="true" />
                                  Rejected
                                </span>
                              )}
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                                  <i className="ti ti-circle-check text-xs" aria-hidden="true" />
                                  Completed
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">
                              {app.appliedDate || 'Recent'}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleApplicationAction(app.applicationID, 'Approved')}
                                    disabled={isProcessing}
                                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                  >
                                    <i className="ti ti-check text-xs" aria-hidden="true" />
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplicationAction(app.applicationID, 'Rejected')}
                                    disabled={isProcessing}
                                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                  >
                                    <i className="ti ti-x text-xs" aria-hidden="true" />
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted font-medium">Decided</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-10 text-center">
                <i className="ti ti-users-minus text-3xl text-muted mx-auto" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-foreground">No applications found</p>
                <p className="mt-1 text-xs text-muted-foreground">When students apply for tasks created by {adminName}, their applications will appear here live.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
