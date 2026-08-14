'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { getTasks, createTask, getAdminDetails, getAdminApplications, updateApplicationStatus, getChatContacts, getChatMessages, sendChatMessage } from '@/lib/api'
import AreaChart from '@/components/charts/AreaChart'
import DonutChart from '@/components/charts/DonutChart'
import BarChart from '@/components/charts/BarChart'

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
  const [activeTab, setActiveTab] = useState<'tasks' | 'applicants' | 'analytics' | 'chat'>('tasks')
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
  const [taskStatusFilter, setTaskStatusFilter] = useState<'active' | 'completed' | 'all'>('active')
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all')
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

  const filteredAdminTasks = useMemo(() => {
    return tasks.filter((t) => {
      const isCompleted = t.status?.toLowerCase() === 'completed'
      if (taskStatusFilter === 'active') return !isCompleted
      if (taskStatusFilter === 'completed') return isCompleted
      return true
    })
  }, [tasks, taskStatusFilter])

  const filteredAdminApps = useMemo(() => {
    return applications.filter((app) => {
      if (appStatusFilter === 'all') return true
      return app.status?.toLowerCase() === appStatusFilter.toLowerCase()
    })
  }, [applications, appStatusFilter])

  const taskStatusCounts = tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const applicationStatusCounts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const applicationDonutData = useMemo(() => {
    const counts: Record<string, number> = {
      Pending: applicationStatusCounts['Pending'] || 0,
      Approved: applicationStatusCounts['Approved'] || 0,
      Rejected: applicationStatusCounts['Rejected'] || 0,
      Completed: applicationStatusCounts['Completed'] || 0,
    }

    const statusColors: Record<string, string> = {
      Pending: '#f59e0b',
      Approved: '#10b981',
      Rejected: '#ef4444',
      Completed: '#3b82f6'
    }

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: statusColors[name] || '#6b7280'
    }))
  }, [applicationStatusCounts])

  const departmentBarData = useMemo(() => {
    const deptStats: Record<string, { posted: number; apps: number }> = {
      'Computer Science': { posted: 0, apps: 0 },
      'BSCIT': { posted: 0, apps: 0 },
      'IT Dept': { posted: 0, apps: 0 },
      'Library': { posted: 0, apps: 0 },
      'Admin': { posted: 0, apps: 0 }
    }

    tasks.forEach(t => {
      const dept = t.department || 'Computer Science'
      if (!deptStats[dept]) deptStats[dept] = { posted: 0, apps: 0 }
      deptStats[dept].posted++
    })

    applications.forEach(() => {
      deptStats['Computer Science'].apps++
    })

    return Object.entries(deptStats).map(([label, stat]) => ({
      label,
      posted: stat.posted,
      applications: stat.apps
    }))
  }, [tasks, applications])

  const adminTrendData = useMemo(() => {
    const totalApps = applications.length
    const totalT = tasks.length
    return [
      { label: 'Mar', posted: Math.max(1, Math.round(totalT * 0.3)), apps: Math.max(2, Math.round(totalApps * 0.2)) },
      { label: 'Apr', posted: Math.max(2, Math.round(totalT * 0.5)), apps: Math.max(4, Math.round(totalApps * 0.4)) },
      { label: 'May', posted: Math.max(3, Math.round(totalT * 0.65)), apps: Math.max(6, Math.round(totalApps * 0.6)) },
      { label: 'Jun', posted: Math.max(4, Math.round(totalT * 0.8)), apps: Math.max(8, Math.round(totalApps * 0.75)) },
      { label: 'Jul', posted: Math.max(5, Math.round(totalT * 0.9)), apps: Math.max(10, Math.round(totalApps * 0.9)) },
      { label: 'Aug', posted: totalT, apps: totalApps },
    ]
  }, [tasks.length, applications.length])

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
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'analytics'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <i className="ti ti-chart-bar" aria-hidden="true" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'chat'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <i className="ti ti-messages" aria-hidden="true" />
            Student Chat (Approved)
          </button>
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <AdminChatSection adminId={adminId} />
        )}

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
                        <div className="relative flex items-center">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <input
                            type="date"
                            value={newTask.deadline}
                            onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                            placeholder="2026-08-30"
                            className="w-full rounded-lg border border-border bg-input pl-9 pr-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
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

            {/* Task Filter Pills */}
            <div className="flex items-center gap-2 pb-1">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Filter:</span>
              {[
                { id: 'active', label: 'Active Tasks' },
                { id: 'completed', label: 'Completed Tasks' },
                { id: 'all', label: 'All Tasks' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTaskStatusFilter(f.id as any)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all border ${
                    taskStatusFilter === f.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              {filteredAdminTasks.length > 0 ? (
                filteredAdminTasks.map(task => (
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
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          task.status?.toLowerCase() === 'completed'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : 'bg-primary/10 border-primary/20 text-primary'
                        }`}>
                          {task.status || 'Open'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-border bg-card p-10 text-center">
                  <i className="ti ti-list-off text-3xl text-muted mx-auto" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium text-foreground">No {taskStatusFilter} tasks found</p>
                  <p className="mt-1 text-xs text-muted-foreground">Try switching your filter or click "+ Add New Task" to post a campus task.</p>
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

            {/* Application Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Status Filter:</span>
              {['all', 'Pending', 'Approved', 'Completed', 'Rejected'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setAppStatusFilter(status)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all border ${
                    appStatusFilter.toLowerCase() === status.toLowerCase()
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted'
                  }`}
                >
                  {status === 'all' ? 'All Statuses' : status}
                </button>
              ))}
            </div>

            {filteredAdminApps.length > 0 ? (
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
                      {filteredAdminApps.map((app) => {
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
                <p className="mt-2 text-sm font-medium text-foreground">No {appStatusFilter === 'all' ? '' : appStatusFilter.toLowerCase()} applications found</p>
                <p className="mt-1 text-xs text-muted-foreground">Try selecting a different status filter or check back when students apply.</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 pb-6">
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <i className="ti ti-chart-dots text-primary text-xl" aria-hidden="true" />
                  Admin Analytics & Task Intelligence
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Real-time analytics for tasks posted by {adminName} ({adminId}).
                </p>
              </div>
              <span className="self-start sm:self-auto rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Live Admin Sync
              </span>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
              <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">Tasks Posted</p>
                  <span className="p-2 rounded-lg bg-secondary text-primary shrink-0 flex items-center justify-center">
                    <i className="ti ti-list-check text-base shrink-0" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{tasks.length}</p>
                <p className="mt-1 text-xs text-muted-foreground truncate">Total tasks active in catalog.</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">Open Applications</p>
                  <span className="p-2 rounded-lg bg-secondary text-amber-500 shrink-0 flex items-center justify-center">
                    <i className="ti ti-users text-base shrink-0" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{pendingAppsCount}</p>
                <p className="mt-1 text-xs text-muted-foreground truncate">Pending student applications.</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">Approved</p>
                  <span className="p-2 rounded-lg bg-secondary text-green-500 shrink-0 flex items-center justify-center">
                    <i className="ti ti-circle-check text-base shrink-0" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{applicationStatusCounts['Approved'] || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground truncate">Applications approved by admin.</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">Completed</p>
                  <span className="p-2 rounded-lg bg-secondary text-blue-500 shrink-0 flex items-center justify-center">
                    <i className="ti ti-circle-dashed-check text-base shrink-0" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{applicationStatusCounts['Completed'] || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground truncate">Tasks completed & rewarded.</p>
              </div>
            </div>

            {/* Analytics Charts Row 1 */}
            <div className="grid gap-4 lg:grid-cols-2 min-w-0">
              {/* Area Chart: Tasks & Apps Trend */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 min-w-0 overflow-hidden">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
                    <i className="ti ti-chart-line text-primary shrink-0" aria-hidden="true" />
                    Monthly Posting & Application Growth
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">Comparative trajectory of tasks posted vs student responses.</p>
                </div>
                <AreaChart
                  data={adminTrendData}
                  series={[
                    { key: 'posted', name: 'Tasks Posted', color: '#f59e0b', gradientId: 'admin-posted' },
                    { key: 'apps', name: 'Student Applications', color: '#3b82f6', gradientId: 'admin-apps' }
                  ]}
                  height={210}
                />
              </div>

              {/* Donut Chart: Application Status */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 min-w-0 overflow-hidden">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
                    <i className="ti ti-chart-donut text-primary shrink-0" aria-hidden="true" />
                    Application Status Distribution
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">Status ratio of all submitted student applications.</p>
                </div>
                <div className="pt-1 min-w-0">
                  <DonutChart
                    data={applicationDonutData}
                    centerLabel="Apps"
                    height={180}
                  />
                </div>
              </div>
            </div>

            {/* Analytics Charts Row 2 */}
            <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr] min-w-0">
              {/* Bar Chart: Department breakdown */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 min-w-0 overflow-hidden">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
                    <i className="ti ti-building text-primary shrink-0" aria-hidden="true" />
                    Tasks & Applications by Department
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">Department-wise activity volume across campus.</p>
                </div>
                <BarChart
                  data={departmentBarData}
                  series={[
                    { key: 'posted', name: 'Tasks Posted', color: '#f59e0b' },
                    { key: 'applications', name: 'Applications', color: '#3b82f6' }
                  ]}
                  height={200}
                />
              </div>

              {/* Status breakdown side panel */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 min-w-0 overflow-hidden">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
                  <i className="ti ti-list text-primary shrink-0" aria-hidden="true" />
                  Task Lifecycle Status
                </h4>
                <div className="space-y-3 min-w-0">
                  {['open', 'in-progress', 'completed'].map((status) => {
                    const count = taskStatusCounts[status] || 0
                    const total = tasks.length || 1
                    const pct = Math.round((count / total) * 100)
                    return (
                      <div key={status} className="rounded-xl border border-border/70 bg-secondary/60 p-3 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1.5 min-w-0">
                          <p className="text-xs font-semibold text-foreground capitalize truncate">{status.replace('-', ' ')}</p>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminChatSection({ adminId }: { adminId: string }) {
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const wordsArray = inputMessage.trim().split(/\s+/).filter(Boolean)
  const wordCount = inputMessage.trim() ? wordsArray.length : 0
  const maxWords = 50
  const isOverLimit = wordCount > maxWords

  const fetchContacts = useCallback(async () => {
    if (!adminId) return
    try {
      setLoadingContacts(true)
      const data = await getChatContacts(adminId, 'admin')
      if (Array.isArray(data)) {
        setContacts(data)
        if (data.length > 0 && !selectedStudent) {
          setSelectedStudent(data[0])
        }
      }
    } catch (err) {
      console.error('Error fetching admin chat contacts:', err)
    } finally {
      setLoadingContacts(false)
    }
  }, [adminId, selectedStudent])

  const fetchMessages = useCallback(async () => {
    if (!adminId || !selectedStudent) return
    try {
      const data = await getChatMessages(adminId, selectedStudent.id)
      if (Array.isArray(data)) {
        setMessages(data)
      }
    } catch (err) {
      console.error('Error fetching admin chat messages:', err)
    }
  }, [adminId, selectedStudent])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  useEffect(() => {
    if (selectedStudent) {
      setLoadingMessages(true)
      fetchMessages().finally(() => setLoadingMessages(false))
      const interval = setInterval(() => {
        fetchMessages()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedStudent, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputMessage.trim() || isOverLimit || sending || !selectedStudent) return

    setErrorMessage('')
    setSending(true)

    try {
      const activeTaskId = selectedStudent.approvedTasks?.[0]?.taskId
      const res = await sendChatMessage({
        senderId: adminId,
        receiverId: selectedStudent.id,
        senderRole: 'admin',
        messageText: inputMessage.trim(),
        taskId: activeTaskId
      })

      if (res?.chatMessage) {
        setMessages((prev) => [...prev, res.chatMessage])
        setInputMessage('')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleQuickTemplate = (text: string) => {
    setInputMessage(text)
    setErrorMessage('')
  }

  const getWordCountBadgeColor = () => {
    if (wordCount === 0) return 'bg-secondary text-muted-foreground border-border'
    if (wordCount <= 35) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
    if (wordCount <= 49) return 'bg-amber-500/10 text-amber-500 border-amber-500/30'
    return 'bg-destructive/20 text-destructive border-destructive/50 animate-pulse'
  }

  if (loadingContacts) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <i className="ti ti-loader animate-spin text-lg" aria-hidden="true" />
          <span>Loading approved student chats...</span>
        </div>
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-4">
          <i className="ti ti-users text-3xl" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No Approved Students Yet</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
          Chat channels open automatically once you approve a student's application in the <strong className="text-foreground">View Applicants</strong> tab.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-[600px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Approved Students List */}
      <div className="w-80 shrink-0 border-r border-border bg-card/60 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <i className="ti ti-messages text-primary text-base" aria-hidden="true" />
              Approved Students
            </h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {contacts.length} Active
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Students with approved task applications
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {contacts.map((student) => {
            const isSelected = selectedStudent?.id === student.id
            return (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${
                  isSelected
                    ? 'bg-secondary/90 border-primary/40 shadow-sm'
                    : 'border-transparent hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm border border-primary/30">
                    {student.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs font-semibold text-foreground">{student.name}</p>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-semibold px-1.5 py-0.2 rounded">Approved</span>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground mt-0.5">{student.department || 'Student'}</p>
                  {student.approvedTasks?.[0] && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-primary font-medium truncate">
                      <i className="ti ti-check text-[10px]" aria-hidden="true" />
                      <span className="truncate">{student.approvedTasks[0].title}</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Chat Thread Area */}
      <div className="flex-1 flex flex-col bg-background/50">
        {/* Chat Top Bar */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm border border-primary/30">
              {selectedStudent?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground">{selectedStudent?.name}</h3>
                <span className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Student ID: {selectedStudent?.id}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {selectedStudent?.email} • {selectedStudent?.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-secondary px-3 py-1 rounded-lg border border-border text-muted-foreground flex items-center gap-1.5">
              <i className="ti ti-info-circle text-primary" aria-hidden="true" />
              Max 50 Words / Message
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingMessages ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              <i className="ti ti-loader animate-spin text-lg mr-2" aria-hidden="true" />
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
              <i className="ti ti-message-dots text-4xl text-muted/40 mb-2" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">No messages exchanged yet</p>
              <p className="text-xs max-w-xs mt-1">
                Send a message to {selectedStudent?.name} regarding their approved task. Keep within 50 words.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId?.toUpperCase() === adminId?.toUpperCase()
              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-muted-foreground">
                      {isMe ? 'You (Admin)' : selectedStudent?.name}
                    </span>
                    <span className="text-[9px] bg-secondary px-1.5 py-0.2 rounded border border-border text-muted-foreground">
                      {msg.wordCount || msg.messageText.split(' ').length} words
                    </span>
                  </div>

                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-card border border-border text-foreground rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.messageText}</p>
                  </div>

                  <span className="text-[9px] text-muted-foreground mt-1 px-1">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Pills for Admin */}
        <div className="px-4 py-2 bg-card/40 border-t border-border flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-muted-foreground font-medium shrink-0 flex items-center gap-1">
            <i className="ti ti-bolt text-amber-500" aria-hidden="true" />
            Quick:
          </span>
          {[
            'Your application is approved! Please proceed with task.',
            'Please review the task guidelines before submitting.',
            'Great progress! Let me know if you need assistance.'
          ].map((pillText, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickTemplate(pillText)}
              className="shrink-0 rounded-full border border-border bg-secondary/60 px-3 py-1 text-[11px] text-foreground transition hover:bg-secondary hover:border-primary/50"
            >
              {pillText}
            </button>
          ))}
        </div>

        {/* Input Form with Word Count */}
        <form onSubmit={handleSendMessage} className="p-3 bg-card border-t border-border shrink-0">
          {errorMessage && (
            <div className="mb-2 text-xs font-semibold text-destructive flex items-center gap-1.5 bg-destructive/10 p-2 rounded-lg border border-destructive/20">
              <i className="ti ti-alert-circle text-base" aria-hidden="true" />
              {errorMessage}
            </div>
          )}

          <div className="relative flex flex-col rounded-xl border border-border bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <textarea
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value)
                setErrorMessage('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Type message to student (Max 50 words)..."
              rows={2}
              className="w-full resize-none bg-transparent p-3 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
            />

            <div className="flex items-center justify-between px-3 pb-2.5">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${getWordCountBadgeColor()}`}>
                  <i className="ti ti-letter-case text-xs" aria-hidden="true" />
                  {wordCount} / {maxWords} words
                </span>

                {isOverLimit && (
                  <span className="text-[11px] font-semibold text-destructive flex items-center gap-1 animate-bounce">
                    <i className="ti ti-alert-triangle" aria-hidden="true" />
                    Exceeds 50-word limit!
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isOverLimit || sending}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <i className="ti ti-loader animate-spin text-sm" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <i className="ti ti-send text-sm" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

