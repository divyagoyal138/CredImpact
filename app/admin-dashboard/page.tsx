'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { getTasks, createTask, getAdminDetails, getAdminApplications, updateApplicationStatus, getChatContacts, getChatMessages, sendChatMessage, getStudents, distributeCC, getCCAllocationHistory } from '@/lib/api'
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
  const [activeTab, setActiveTab] = useState<'tasks' | 'applicants' | 'analytics' | 'chat' | 'allocate-cc' | 'allocation-history'>('tasks')
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

  // Manage Event CC & Credit Coin Allocation state
  const [showManageCCModal, setShowManageCCModal] = useState(false)
  const [selectedCCTaskId, setSelectedCCTaskId] = useState<number | null>(null)
  const [editedCCAmount, setEditedCCAmount] = useState<number>(50)
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all')
  const [studentScope, setStudentScope] = useState<'all' | 'applicants'>('all')
  const [allStudentsList, setAllStudentsList] = useState<any[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [allocationVenue, setAllocationVenue] = useState<string>('Main Campus Auditorium')
  const [isDistributingCC, setIsDistributingCC] = useState(false)
  const [distributeToast, setDistributeToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Inline Create Task inside CC Modal state
  const [showInlineCreateTask, setShowInlineCreateTask] = useState(false)
  const [inlineTaskData, setInlineTaskData] = useState<Partial<Task>>({
    title: '',
    description: '',
    department: 'Computer Science',
    cc: 50,
    deadline: '',
    category: 'Event Help',
  })

  // CC Allocation History state
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyList, setHistoryList] = useState<any[]>([])
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null)
  const [historySearchQuery, setHistorySearchQuery] = useState('')

  const handleOpenManageCC = async (taskToAward?: Task | null) => {
    const targetTaskId = taskToAward ? taskToAward.id : (tasks[0]?.id || null)
    const targetCC = taskToAward ? (taskToAward.cc || 50) : 50
    const targetDept = taskToAward ? (taskToAward.department || 'all') : 'all'

    setSelectedCCTaskId(targetTaskId)
    setEditedCCAmount(targetCC)
    setSelectedClassFilter(targetDept)
    setShowManageCCModal(true)
    setShowInlineCreateTask(false)
    setDistributeToast(null)

    try {
      const fetchedStudents = await getStudents().catch(() => [])
      if (Array.isArray(fetchedStudents) && fetchedStudents.length > 0) {
        setAllStudentsList(fetchedStudents)
        setSelectedStudentIds(fetchedStudents.map((s: any) => s.studentid || s.id))
      } else {
        const fallback = [
          { id: '2023CSE045', studentID: '2023CSE045', name: 'Aarav Patel', email: 'aarav@kjsce.edu', department: 'Computer Science', semester: 5, ccBalance: 120 },
          { id: '2023CSE012', studentID: '2023CSE012', name: 'Ananya Sharma', email: 'ananya@kjsce.edu', department: 'Computer Science', semester: 5, ccBalance: 95 },
          { id: '2023IT008', studentID: '2023IT008', name: 'Rohan Mehta', email: 'rohan@kjsce.edu', department: 'IT Dept', semester: 3, ccBalance: 150 },
          { id: '2023BSC004', studentID: '2023BSC004', name: 'Priya Singh', email: 'priya@kjsce.edu', department: 'BSCIT', semester: 4, ccBalance: 80 },
          { id: '2023ADM002', studentID: '2023ADM002', name: 'Karan Verma', email: 'karan@kjsce.edu', department: 'Admin', semester: 1, ccBalance: 60 },
        ]
        setAllStudentsList(fallback)
        setSelectedStudentIds(fallback.map(s => s.id))
      }
    } catch (e) {
      console.error('Error fetching students list:', e)
    }
  }

  const handleOpenHistoryModal = async () => {
    setShowHistoryModal(true)
    try {
      const hData = await getCCAllocationHistory().catch(() => [])
      if (Array.isArray(hData)) {
        setHistoryList(hData)
        if (hData.length > 0) {
          setSelectedHistoryItem(hData[0])
        } else {
          setSelectedHistoryItem(null)
        }
      }
    } catch (err) {
      console.error('Error loading database history:', err)
      setHistoryList([])
      setSelectedHistoryItem(null)
    }
  }

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleToggleSelectAllStudents = (studentsToToggle: any[]) => {
    const ids = studentsToToggle.map(s => s.studentid || s.id)
    const allSelected = ids.every(id => selectedStudentIds.includes(id))
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !ids.includes(id)))
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...ids])))
    }
  }

  const handleInlineCreateTask = async () => {
    if (!inlineTaskData.title || !inlineTaskData.description) {
      alert('Task Title and Description are required')
      return
    }
    setIsSubmitting(true)
    try {
      const created = await createTask({
        title: inlineTaskData.title,
        description: inlineTaskData.description,
        creditcoins: inlineTaskData.cc || 50,
        deadline: inlineTaskData.deadline || '2026-08-30',
        createdby: user?.uid || user?.adminid || 'ADM001'
      })
      await fetchDashboardData()

      const updatedTasks = await getTasks().catch(() => [])
      if (Array.isArray(updatedTasks) && updatedTasks.length > 0) {
        setTasks(updatedTasks)
        const newest = updatedTasks[0]
        setSelectedCCTaskId(newest.id)
        setEditedCCAmount(newest.cc || inlineTaskData.cc || 50)
      } else if (created && (created.id || created.taskid)) {
        const newId = created.id || created.taskid
        setSelectedCCTaskId(newId)
        setEditedCCAmount(created.cc || inlineTaskData.cc || 50)
      }
      setShowInlineCreateTask(false)
      setInlineTaskData({
        title: '',
        description: '',
        department: 'Computer Science',
        cc: 50,
        deadline: '',
        category: 'Event Help',
      })
    } catch (err) {
      console.error('Error creating inline task:', err)
      alert('Failed to create task. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitCCDistribution = async () => {
    if (!selectedCCTaskId) {
      alert('Please select a valid task/event')
      return
    }
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student to award CC')
      return
    }

    setIsDistributingCC(true)
    try {
      const awardedStudentsInfo = allStudentsList
        .filter(s => selectedStudentIds.includes(s.studentid || s.id))
        .map(s => ({
          studentID: s.studentid || s.id,
          name: s.name,
          email: s.email,
          department: s.department
        }))

      const res = await distributeCC({
        taskId: selectedCCTaskId,
        cc: editedCCAmount,
        studentIds: selectedStudentIds,
        venue: allocationVenue || 'Main Campus Auditorium',
        department: selectedClassFilter === 'all' ? 'All Classes' : selectedClassFilter,
        studentsInfo: awardedStudentsInfo
      })

      setDistributeToast({
        message: res.message || `Successfully granted ${editedCCAmount} CC to ${selectedStudentIds.length} student(s)!`,
        type: 'success'
      })

      await fetchDashboardData()

      setTimeout(() => {
        setShowManageCCModal(false)
        setDistributeToast(null)
      }, 1800)
    } catch (err: any) {
      console.error('Error distributing CC:', err)
      setDistributeToast({
        message: err.message || 'Failed to distribute CC. Please try again.',
        type: 'error'
      })
    } finally {
      setIsDistributingCC(false)
    }
  }

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

  useEffect(() => {
    if (showHistoryModal) {
      const pollHistory = async () => {
        const hData = await getCCAllocationHistory().catch(() => [])
        if (Array.isArray(hData) && hData.length > 0) {
          setHistoryList(hData)
        }
      }
      pollHistory()
      const interval = setInterval(pollHistory, 3000)
      return () => clearInterval(interval)
    }
  }, [showHistoryModal])

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

  const [selectedTaskFilter, setSelectedTaskFilter] = useState<number | 'all'>('all')
  const [appSearchQuery, setAppSearchQuery] = useState('')
  const [targetChatStudentId, setTargetChatStudentId] = useState<string | null>(null)

  const filteredAdminApps = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus = appStatusFilter === 'all' || app.status?.toLowerCase() === appStatusFilter.toLowerCase()
      const matchesTask = selectedTaskFilter === 'all' || selectedTaskFilter === 0 || app.taskID === selectedTaskFilter
      const q = appSearchQuery.trim().toLowerCase()
      const matchesSearch = !q || (
        app.name?.toLowerCase().includes(q) ||
        app.studentID?.toLowerCase().includes(q) ||
        app.email?.toLowerCase().includes(q) ||
        app.title?.toLowerCase().includes(q)
      )
      return matchesStatus && matchesTask && matchesSearch
    })
  }, [applications, appStatusFilter, selectedTaskFilter, appSearchQuery])

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

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                onClick={() => setShowAddTask(true)}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
              >
                <i className="ti ti-plus text-sm" aria-hidden="true" />
                Add New Task
              </button>
            </div>
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
          <button
            onClick={() => {
              setActiveTab('allocate-cc')
              handleOpenManageCC(null)
            }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'allocate-cc'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <i className="ti ti-award text-amber-500" aria-hidden="true" />
            CC Allocation to Class
          </button>
          <button
            onClick={() => {
              setActiveTab('allocation-history')
              handleOpenHistoryModal()
            }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'allocation-history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <i className="ti ti-history text-primary" aria-hidden="true" />
            Allocation History
          </button>
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <AdminChatSection
            adminId={adminId}
            initialStudentId={targetChatStudentId}
            onNavigateToApplicants={() => {
              setActiveTab('applicants')
            }}
            onNavigateToAllocateCC={() => {
              setActiveTab('allocate-cc')
              handleOpenManageCC(null)
            }}
          />
        )}

        {/* Section 5: CC Allocation to Class */}
        {activeTab === 'allocate-cc' && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                  <i className="ti ti-award text-base" aria-hidden="true" />
                  Credit Coin Allocation & Event Management
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Allocate Credit Coins to Class & Event Attendees
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Select or create an event, set custom CC reward, filter by department, and award credits to specific students.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('allocation-history')
                    handleOpenHistoryModal()
                  }}
                  className="rounded-xl border border-border bg-secondary/80 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all flex items-center gap-2 shadow-xs"
                >
                  <i className="ti ti-history text-primary text-sm" />
                  📜 Go to History Section
                </button>
              </div>
            </div>

            {/* Main CC Allocation Section Card */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-md space-y-5">
              {distributeToast && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  distributeToast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                }`}>
                  <i className={`ti ${distributeToast.type === 'success' ? 'ti-circle-check' : 'ti-alert-circle'} text-base`} />
                  {distributeToast.message}
                </div>
              )}

              {/* Inline Create New Task Option */}
              {showInlineCreateTask && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center pb-1 border-b border-primary/20">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <i className="ti ti-sparkles" /> Create New Task / Event
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowInlineCreateTask(false)}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Task Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Hackathon Attendance"
                        value={inlineTaskData.title || ''}
                        onChange={(e) => setInlineTaskData({ ...inlineTaskData, title: e.target.value })}
                        className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">CC Reward</label>
                      <input
                        type="number"
                        placeholder="50"
                        value={inlineTaskData.cc || 50}
                        onChange={(e) => setInlineTaskData({ ...inlineTaskData, cc: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Description</label>
                    <textarea
                      placeholder="Provide details about requirements and event criteria..."
                      rows={2}
                      value={inlineTaskData.description || ''}
                      onChange={(e) => setInlineTaskData({ ...inlineTaskData, description: e.target.value })}
                      className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <select
                      value={inlineTaskData.department || 'Computer Science'}
                      onChange={(e) => setInlineTaskData({ ...inlineTaskData, department: e.target.value })}
                      className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="BSCIT">BSCIT</option>
                      <option value="IT Dept">IT Dept</option>
                      <option value="Admin">Admin</option>
                      <option value="Library">Library</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleInlineCreateTask}
                      disabled={isSubmitting}
                      className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <i className="ti ti-check text-xs" />
                      {isSubmitting ? 'Creating...' : 'Publish & Select Event'}
                    </button>
                  </div>
                </div>
              )}

              {/* Task & CC Input Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-secondary/50 p-4 rounded-xl border border-border">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase text-muted-foreground">
                      Select Task / Event
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowInlineCreateTask(!showInlineCreateTask)}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <i className="ti ti-plus text-xs" />
                      {showInlineCreateTask ? 'Close Creator' : '+ Add New Event'}
                    </button>
                  </div>
                  <select
                    value={selectedCCTaskId || ''}
                    onChange={(e) => {
                      const tId = parseInt(e.target.value)
                      setSelectedCCTaskId(tId)
                      const foundTask = tasks.find(t => t.id === tId)
                      if (foundTask) setEditedCCAmount(foundTask.cc || 50)
                    }}
                    className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                  >
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>
                        #{t.id} - {t.title} ({t.department || 'CS'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Event CC Reward
                  </label>
                  <div className="relative">
                    <i className="ti ti-coin absolute left-3 top-1/2 -translate-y-1/2 text-coin text-sm pointer-events-none" />
                    <input
                      type="number"
                      value={editedCCAmount}
                      onChange={(e) => setEditedCCAmount(Math.max(1, parseInt(e.target.value) || 0))}
                      placeholder="50"
                      className="w-full rounded-lg border border-border bg-input pl-8 pr-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Event Venue Input */}
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                  <i className="ti ti-map-pin text-primary text-xs" /> Event Venue / Location
                </label>
                <input
                  type="text"
                  value={allocationVenue}
                  onChange={(e) => setAllocationVenue(e.target.value)}
                  placeholder="e.g. Main Auditorium, Block A / Computer Lab 304"
                  className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Class / Department & Scope Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Filter by Class / Department
                  </label>
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="all">All Classes & Departments</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="BSCIT">BSCIT</option>
                    <option value="IT Dept">IT Dept</option>
                    <option value="Library">Library</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Student Target Group
                  </label>
                  <div className="flex rounded-lg border border-border bg-input p-1">
                    <button
                      type="button"
                      onClick={() => setStudentScope('all')}
                      className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-all ${
                        studentScope === 'all' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      All Class Students
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentScope('applicants')}
                      className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-all ${
                        studentScope === 'applicants' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Event Applicants Only
                    </button>
                  </div>
                </div>
              </div>

              {/* Student Selection Checklist */}
              <div className="space-y-2">
                {(() => {
                  const taskAppStudents = applications
                    .filter(a => a.taskID === selectedCCTaskId)
                    .map(a => a.studentID.toUpperCase())

                  let filteredStudents = allStudentsList.filter(s => {
                    const matchesClass = selectedClassFilter === 'all' || s.department?.toLowerCase() === selectedClassFilter.toLowerCase()
                    const sId = (s.studentid || s.id).toUpperCase()
                    const matchesScope = studentScope === 'all' || taskAppStudents.includes(sId)
                    return matchesClass && matchesScope
                  })

                  const allVisibleSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.studentid || s.id))

                  return (
                    <>
                      <div className="flex items-center justify-between px-1 py-1 border-b border-border/80 text-xs">
                        <label className="flex items-center gap-2 font-bold text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={() => handleToggleSelectAllStudents(filteredStudents)}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          Select All Visible Students ({filteredStudents.length})
                        </label>
                        <span className="text-muted-foreground font-semibold text-[11px]">
                          {selectedStudentIds.length} Selected
                        </span>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1 pt-1">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map(student => {
                            const sid = student.studentid || student.id
                            const isChecked = selectedStudentIds.includes(sid)
                            const hasApplied = taskAppStudents.includes(sid.toUpperCase())

                            return (
                              <div
                                key={sid}
                                onClick={() => handleToggleStudent(sid)}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                  isChecked ? 'bg-primary/10 border-primary/40 shadow-2xs' : 'bg-card border-border/60 hover:border-muted'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="rounded border-border text-primary focus:ring-primary"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-foreground truncate flex items-center gap-2">
                                      {student.name}
                                      <span className="text-[10px] font-medium text-muted-foreground">({sid})</span>
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                      {student.email} · Sem {student.semester || 1}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {hasApplied && (
                                    <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-500">
                                      Applicant
                                    </span>
                                  )}
                                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-coin flex items-center gap-1">
                                    <i className="ti ti-coin text-xs" />
                                    {student.ccBalance || 100} CC
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="p-6 text-center text-xs text-muted-foreground bg-secondary/40 rounded-xl border border-dashed border-border">
                            No students match the selected class filter or target group.
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Each student will receive <strong className="text-coin">{editedCCAmount} CC</strong>
                </div>
                <button
                  type="button"
                  onClick={handleSubmitCCDistribution}
                  disabled={isDistributingCC || selectedStudentIds.length === 0}
                  className="rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <i className="ti ti-coin text-sm" />
                  {isDistributingCC ? 'Granting Credits...' : `Grant ${editedCCAmount} CC to ${selectedStudentIds.length} Student(s)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 6: Allocation History */}
        {activeTab === 'allocation-history' && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                  <i className="ti ti-history text-base" aria-hidden="true" />
                  Audit & Compliance Directory
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  CC Allocation & Event Credit History
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tap any history record to inspect event venue, timestamp, class, and complete student recipient roster.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('allocate-cc')
                    handleOpenManageCC(null)
                  }}
                  className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xs"
                >
                  <i className="ti ti-award text-sm" />
                  ⚡ Go to CC Allocation Section
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
              <input
                type="search"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Filter history by event title, venue location, or student name..."
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>

            {/* History 2-Column Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[420px]">
              {/* Left Column: History Records List */}
              <div className="md:col-span-5 border-r border-border/70 pr-0 md:pr-4 space-y-2.5 max-h-[500px] overflow-y-auto">
                {(() => {
                  const filteredHistory = historyList.filter(item => {
                    if (!historySearchQuery) return true
                    const q = historySearchQuery.toLowerCase()
                    return (
                      item.taskTitle?.toLowerCase().includes(q) ||
                      item.venue?.toLowerCase().includes(q) ||
                      item.department?.toLowerCase().includes(q) ||
                      item.students?.some((s: any) => s.name?.toLowerCase().includes(q) || (s.studentID || s.id)?.toLowerCase().includes(q))
                    )
                  })

                  if (filteredHistory.length === 0) {
                    return (
                      <div className="p-8 text-center text-xs text-muted-foreground bg-secondary/30 rounded-xl border border-dashed border-border">
                        No allocation history found matching query.
                      </div>
                    )
                  }

                  return filteredHistory.map((item) => {
                    const isSelected = selectedHistoryItem?.id === item.id
                    const formattedDate = item.timestamp
                      ? new Date(item.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                      : 'Recent'

                    return (
                      <div
                        key={item.id || item.timestamp}
                        onClick={() => setSelectedHistoryItem(item)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 border-primary shadow-xs'
                            : 'bg-card border-border/80 hover:bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-foreground leading-tight line-clamp-1">
                            {item.taskTitle}
                          </h4>
                          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-coin">
                            +{item.ccAmount} CC
                          </span>
                        </div>

                        <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                          <p className="flex items-center gap-1.5 truncate">
                            <i className="ti ti-map-pin text-primary text-xs shrink-0" />
                            <span className="truncate">{item.venue || 'Main Auditorium'}</span>
                          </p>
                          <p className="flex items-center gap-1.5 truncate">
                            <i className="ti ti-building text-muted-foreground text-xs shrink-0" />
                            <span>{item.department || 'All Classes'}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-[10px] text-muted truncate pt-0.5">
                            <i className="ti ti-clock text-xs shrink-0" />
                            <span>{formattedDate}</span>
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <i className="ti ti-users text-xs text-primary" />
                            {item.studentCount || item.students?.length || 0} Recipients
                          </span>
                          <span className="text-primary font-bold flex items-center gap-0.5">
                            Inspect <i className="ti ti-chevron-right text-xs" />
                          </span>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>

              {/* Right Column: Selected History Detail Inspection View */}
              <div className="md:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pl-0 md:pl-2">
                {selectedHistoryItem ? (
                  <div className="space-y-4">
                    <div className="bg-card rounded-xl border border-border p-5 space-y-3 shadow-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="rounded-md bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Allocation #{selectedHistoryItem.id}
                          </span>
                          <h4 className="text-base font-bold text-foreground mt-1">
                            {selectedHistoryItem.taskTitle}
                          </h4>
                        </div>
                        <span className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs shrink-0">
                          +{selectedHistoryItem.ccAmount} CC / Student
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 text-xs border-t border-border/60">
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                            Venue / Place
                          </span>
                          <p className="font-semibold text-foreground flex items-center gap-1.5">
                            <i className="ti ti-map-pin text-primary" />
                            {selectedHistoryItem.venue || 'Main Auditorium'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                            Target Class / Dept
                          </span>
                          <p className="font-semibold text-foreground flex items-center gap-1.5">
                            <i className="ti ti-building text-primary" />
                            {selectedHistoryItem.department || 'All Classes'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                            Date & Time
                          </span>
                          <p className="font-medium text-foreground flex items-center gap-1.5 text-[11px]">
                            <i className="ti ti-calendar text-muted-foreground" />
                            {selectedHistoryItem.timestamp ? new Date(selectedHistoryItem.timestamp).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                            Allocated By
                          </span>
                          <p className="font-medium text-foreground flex items-center gap-1.5 text-[11px]">
                            <i className="ti ti-user-check text-muted-foreground" />
                            {selectedHistoryItem.adminName || 'Wilson Rao'} ({selectedHistoryItem.adminId || 'ADM001'})
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 flex items-center gap-2">
                        <i className="ti ti-users-group text-primary text-sm" />
                        Student Recipients ({selectedHistoryItem.students?.length || selectedHistoryItem.studentCount || 0})
                      </h5>

                      <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <div className="max-h-60 overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-secondary/70 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                              <tr>
                                <th className="py-2.5 px-3">Student</th>
                                <th className="py-2.5 px-3">Class/Dept</th>
                                <th className="py-2.5 px-3 text-right">Awarded</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {selectedHistoryItem.students?.map((st: any, idx: number) => (
                                <tr key={st.studentID || st.id || idx} className="hover:bg-secondary/40">
                                  <td className="py-2.5 px-3">
                                    <p className="font-bold text-foreground text-xs">{st.name || st.studentID}</p>
                                    <p className="text-[10px] text-muted-foreground">{st.studentID || st.email}</p>
                                  </td>
                                  <td className="py-2.5 px-3 text-[11px] text-muted-foreground font-medium">
                                    {st.department || selectedHistoryItem.department || 'CS'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-coin text-xs">
                                    +{selectedHistoryItem.ccAmount} CC
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-8 text-center text-xs text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border">
                    Select a history record on the left to view complete event details and student roster.
                  </div>
                )}
              </div>
            </div>
          </div>
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

            {/* CC Allocation History Directory Modal */}
            {showHistoryModal && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs overflow-y-auto">
                <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-4xl shadow-2xl space-y-5 my-8">
                  {/* Modal Header */}
                  <div className="flex justify-between items-start pb-4 border-b border-border">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                        <i className="ti ti-history text-base" aria-hidden="true" />
                        Audit & Compliance Directory
                      </div>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">
                        CC Allocation & Event Credit History
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Tap any history record to inspect event venue, timestamp, class, and complete student recipient roster.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowHistoryModal(false)}
                      className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary text-lg"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    <input
                      type="search"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="Filter history by event title, venue location, or student name..."
                      className="w-full rounded-xl border border-border bg-input py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[360px]">
                    {/* Left Column: History Records List */}
                    <div className="md:col-span-5 border-r border-border/70 pr-0 md:pr-4 space-y-2.5 max-h-[420px] overflow-y-auto">
                      {(() => {
                        const filteredHistory = historyList.filter(item => {
                          if (!historySearchQuery) return true
                          const q = historySearchQuery.toLowerCase()
                          return (
                            item.taskTitle?.toLowerCase().includes(q) ||
                            item.venue?.toLowerCase().includes(q) ||
                            item.department?.toLowerCase().includes(q) ||
                            item.students?.some((s: any) => s.name?.toLowerCase().includes(q) || (s.studentID || s.id)?.toLowerCase().includes(q))
                          )
                        })

                        if (filteredHistory.length === 0) {
                          return (
                            <div className="p-8 text-center text-xs text-muted-foreground bg-secondary/30 rounded-xl border border-dashed border-border">
                              No allocation history found matching query.
                            </div>
                          )
                        }

                        return filteredHistory.map((item) => {
                          const isSelected = selectedHistoryItem?.id === item.id
                          const formattedDate = item.timestamp
                            ? new Date(item.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                            : 'Recent'

                          return (
                            <div
                              key={item.id || item.timestamp}
                              onClick={() => setSelectedHistoryItem(item)}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-primary/10 border-primary shadow-xs'
                                  : 'bg-card border-border/80 hover:bg-secondary/50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-bold text-foreground leading-tight line-clamp-1">
                                  {item.taskTitle}
                                </h4>
                                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-coin">
                                  +{item.ccAmount} CC
                                </span>
                              </div>

                              <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                                <p className="flex items-center gap-1.5 truncate">
                                  <i className="ti ti-map-pin text-primary text-xs shrink-0" />
                                  <span className="truncate">{item.venue || 'Main Auditorium'}</span>
                                </p>
                                <p className="flex items-center gap-1.5 truncate">
                                  <i className="ti ti-building text-muted-foreground text-xs shrink-0" />
                                  <span>{item.department || 'All Classes'}</span>
                                </p>
                                <p className="flex items-center gap-1.5 text-[10px] text-muted truncate pt-0.5">
                                  <i className="ti ti-clock text-xs shrink-0" />
                                  <span>{formattedDate}</span>
                                </p>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                                <span className="font-semibold text-foreground flex items-center gap-1">
                                  <i className="ti ti-users text-xs text-primary" />
                                  {item.studentCount || item.students?.length || 0} Recipients
                                </span>
                                <span className="text-primary font-bold flex items-center gap-0.5">
                                  Inspect <i className="ti ti-chevron-right text-xs" />
                                </span>
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>

                    {/* Right Column: Selected History Detail Inspection View */}
                    <div className="md:col-span-7 space-y-4 max-h-[420px] overflow-y-auto pl-0 md:pl-2">
                      {selectedHistoryItem ? (
                        <div className="space-y-4">
                          <div className="bg-secondary/40 rounded-xl border border-border p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="rounded-md bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                  Allocation #{selectedHistoryItem.id}
                                </span>
                                <h4 className="text-base font-bold text-foreground mt-1">
                                  {selectedHistoryItem.taskTitle}
                                </h4>
                              </div>
                              <span className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs shrink-0">
                                +{selectedHistoryItem.ccAmount} CC / Student
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-border/60">
                              <div>
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                                  Venue / Place
                                </span>
                                <p className="font-semibold text-foreground flex items-center gap-1.5">
                                  <i className="ti ti-map-pin text-primary" />
                                  {selectedHistoryItem.venue || 'Main Auditorium'}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                                  Target Class / Dept
                                </span>
                                <p className="font-semibold text-foreground flex items-center gap-1.5">
                                  <i className="ti ti-building text-primary" />
                                  {selectedHistoryItem.department || 'All Classes'}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                                  Date & Time
                                </span>
                                <p className="font-medium text-foreground flex items-center gap-1.5 text-[11px]">
                                  <i className="ti ti-calendar text-muted-foreground" />
                                  {selectedHistoryItem.timestamp ? new Date(selectedHistoryItem.timestamp).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                                  Allocated By
                                </span>
                                <p className="font-medium text-foreground flex items-center gap-1.5 text-[11px]">
                                  <i className="ti ti-user-check text-muted-foreground" />
                                  {selectedHistoryItem.adminName || 'Wilson Rao'} ({selectedHistoryItem.adminId || 'ADM001'})
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 flex items-center gap-2">
                              <i className="ti ti-users-group text-primary text-sm" />
                              Student Recipients ({selectedHistoryItem.students?.length || selectedHistoryItem.studentCount || 0})
                            </h5>

                            <div className="overflow-hidden rounded-xl border border-border bg-card">
                              <div className="max-h-52 overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-secondary/70 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                                    <tr>
                                      <th className="py-2 px-3">Student</th>
                                      <th className="py-2 px-3">Class/Dept</th>
                                      <th className="py-2 px-3 text-right">Awarded</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/60">
                                    {selectedHistoryItem.students?.map((st: any, idx: number) => (
                                      <tr key={st.studentID || st.id || idx} className="hover:bg-secondary/40">
                                        <td className="py-2.5 px-3">
                                          <p className="font-bold text-foreground text-xs">{st.name || st.studentID}</p>
                                          <p className="text-[10px] text-muted-foreground">{st.studentID || st.email}</p>
                                        </td>
                                        <td className="py-2.5 px-3 text-[11px] text-muted-foreground font-medium">
                                          {st.department || selectedHistoryItem.department || 'CS'}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-coin text-xs">
                                          +{selectedHistoryItem.ccAmount} CC
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center p-8 text-center text-xs text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border">
                          Select a history record on the left to view complete event details and student roster.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowHistoryModal(false)}
                      className="rounded-xl border border-border bg-secondary px-5 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Close History
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Event CC & Class Credit Award Modal */}
            {showManageCCModal && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs overflow-y-auto">
                <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-2xl shadow-2xl space-y-5 my-8">
                  {/* Modal Header */}
                  <div className="flex justify-between items-start pb-4 border-b border-border">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                        <i className="ti ti-award text-base" aria-hidden="true" />
                        Credit Coin Allocation & Event Management
                      </div>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">
                        Edit Event CC & Award Class / Students
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Set custom CC amount for an event, pick a class/department, and select student attendees to credit.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenHistoryModal}
                        className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1.5"
                      >
                        <i className="ti ti-history text-primary text-xs" />
                        History Log
                      </button>
                      <button
                        onClick={() => setShowManageCCModal(false)}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary text-lg"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {distributeToast && (
                    <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      distributeToast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                    }`}>
                      <i className={`ti ${distributeToast.type === 'success' ? 'ti-circle-check' : 'ti-alert-circle'} text-base`} />
                      {distributeToast.message}
                    </div>
                  )}

                  {/* Inline Create New Task Option */}
                  {showInlineCreateTask && (
                    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 shadow-xs">
                      <div className="flex justify-between items-center pb-1 border-b border-primary/20">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <i className="ti ti-sparkles" /> Create New Task / Event
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowInlineCreateTask(false)}
                          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Task Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Hackathon Attendance"
                            value={inlineTaskData.title || ''}
                            onChange={(e) => setInlineTaskData({ ...inlineTaskData, title: e.target.value })}
                            className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">CC Reward</label>
                          <input
                            type="number"
                            placeholder="50"
                            value={inlineTaskData.cc || 50}
                            onChange={(e) => setInlineTaskData({ ...inlineTaskData, cc: parseInt(e.target.value) || 0 })}
                            className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Description</label>
                        <textarea
                          placeholder="Provide details about requirements and event criteria..."
                          rows={2}
                          value={inlineTaskData.description || ''}
                          onChange={(e) => setInlineTaskData({ ...inlineTaskData, description: e.target.value })}
                          className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <select
                          value={inlineTaskData.department || 'Computer Science'}
                          onChange={(e) => setInlineTaskData({ ...inlineTaskData, department: e.target.value })}
                          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                        >
                          <option value="Computer Science">Computer Science</option>
                          <option value="BSCIT">BSCIT</option>
                          <option value="IT Dept">IT Dept</option>
                          <option value="Admin">Admin</option>
                          <option value="Library">Library</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleInlineCreateTask}
                          disabled={isSubmitting}
                          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <i className="ti ti-check text-xs" />
                          {isSubmitting ? 'Creating...' : 'Publish & Select Event'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Task & CC Input Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-secondary/50 p-4 rounded-xl border border-border">
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold uppercase text-muted-foreground">
                          Select Task / Event
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowInlineCreateTask(!showInlineCreateTask)}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <i className="ti ti-plus text-xs" />
                          {showInlineCreateTask ? 'Close Creator' : '+ Add New Event'}
                        </button>
                      </div>
                      <select
                        value={selectedCCTaskId || ''}
                        onChange={(e) => {
                          const tId = parseInt(e.target.value)
                          setSelectedCCTaskId(tId)
                          const foundTask = tasks.find(t => t.id === tId)
                          if (foundTask) setEditedCCAmount(foundTask.cc || 50)
                        }}
                        className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                      >
                        {tasks.map(t => (
                          <option key={t.id} value={t.id}>
                            #{t.id} - {t.title} ({t.department || 'CS'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Event CC Reward
                      </label>
                      <div className="relative">
                        <i className="ti ti-coin absolute left-3 top-1/2 -translate-y-1/2 text-coin text-sm pointer-events-none" />
                        <input
                          type="number"
                          value={editedCCAmount}
                          onChange={(e) => setEditedCCAmount(Math.max(1, parseInt(e.target.value) || 0))}
                          placeholder="50"
                          className="w-full rounded-lg border border-border bg-input pl-8 pr-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Event Venue Input */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                      <i className="ti ti-map-pin text-primary text-xs" /> Event Venue / Location
                    </label>
                    <input
                      type="text"
                      value={allocationVenue}
                      onChange={(e) => setAllocationVenue(e.target.value)}
                      placeholder="e.g. Main Auditorium, Block A / Computer Lab 304"
                      className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Class / Department & Scope Filter */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Filter by Class / Department
                      </label>
                      <select
                        value={selectedClassFilter}
                        onChange={(e) => setSelectedClassFilter(e.target.value)}
                        className="w-full rounded-lg border border-border bg-input px-3.5 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="all">All Classes & Departments</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="BSCIT">BSCIT</option>
                        <option value="IT Dept">IT Dept</option>
                        <option value="Library">Library</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Student Target Group
                      </label>
                      <div className="flex rounded-lg border border-border bg-input p-1">
                        <button
                          type="button"
                          onClick={() => setStudentScope('all')}
                          className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-all ${
                            studentScope === 'all' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          All Class Students
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentScope('applicants')}
                          className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-all ${
                            studentScope === 'applicants' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Event Applicants Only
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Student Selection Checklist */}
                  <div className="space-y-2">
                    {(() => {
                      const taskAppStudents = applications
                        .filter(a => a.taskID === selectedCCTaskId)
                        .map(a => a.studentID.toUpperCase())

                      let filteredStudents = allStudentsList.filter(s => {
                        const matchesClass = selectedClassFilter === 'all' || s.department?.toLowerCase() === selectedClassFilter.toLowerCase()
                        const sId = (s.studentid || s.id).toUpperCase()
                        const matchesScope = studentScope === 'all' || taskAppStudents.includes(sId)
                        return matchesClass && matchesScope
                      })

                      const allVisibleSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.studentid || s.id))

                      return (
                        <>
                          <div className="flex items-center justify-between px-1 py-1 border-b border-border/80 text-xs">
                            <label className="flex items-center gap-2 font-bold text-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                checked={allVisibleSelected}
                                onChange={() => handleToggleSelectAllStudents(filteredStudents)}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              Select All Visible Students ({filteredStudents.length})
                            </label>
                            <span className="text-muted-foreground font-semibold text-[11px]">
                              {selectedStudentIds.length} Selected
                            </span>
                          </div>

                          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 pt-1">
                            {filteredStudents.length > 0 ? (
                              filteredStudents.map(student => {
                                const sid = student.studentid || student.id
                                const isChecked = selectedStudentIds.includes(sid)
                                const hasApplied = taskAppStudents.includes(sid.toUpperCase())

                                return (
                                  <div
                                    key={sid}
                                    onClick={() => handleToggleStudent(sid)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                      isChecked ? 'bg-primary/10 border-primary/40 shadow-2xs' : 'bg-card border-border/60 hover:border-muted'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {}}
                                        className="rounded border-border text-primary focus:ring-primary"
                                      />
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate flex items-center gap-2">
                                          {student.name}
                                          <span className="text-[10px] font-medium text-muted-foreground">({sid})</span>
                                        </p>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                          {student.email} · Sem {student.semester || 1}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      {hasApplied && (
                                        <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-500">
                                          Applicant
                                        </span>
                                      )}
                                      <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-coin flex items-center gap-1">
                                        <i className="ti ti-coin text-xs" />
                                        {student.ccBalance || 100} CC
                                      </span>
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <div className="p-6 text-center text-xs text-muted-foreground bg-secondary/40 rounded-xl border border-dashed border-border">
                                No students match the selected class filter or target group.
                              </div>
                            )}
                          </div>
                        </>
                      )
                    })()}
                  </div>

                  {/* Action Footer */}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      Each student will receive <strong className="text-coin">{editedCCAmount} CC</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowManageCCModal(false)}
                        className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitCCDistribution}
                        disabled={isDistributingCC || selectedStudentIds.length === 0}
                        className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                      >
                        <i className="ti ti-coin text-sm" />
                        {isDistributingCC ? 'Granting Credits...' : `Grant ${editedCCAmount} CC to ${selectedStudentIds.length} Student(s)`}
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
                        <div className="flex flex-col sm:flex-row items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTaskFilter(task.id)
                              setActiveTab('applicants')
                            }}
                            className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-all flex items-center gap-1.5"
                          >
                            <i className="ti ti-users text-xs" aria-hidden="true" />
                            View Applicants ({applications.filter(a => a.taskID === task.id).length})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenManageCC(task)}
                            className="rounded-lg border border-border bg-secondary/80 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all flex items-center gap-1.5"
                          >
                            <i className="ti ti-coin text-amber-500 text-xs" aria-hidden="true" />
                            Edit CC & Award Class
                          </button>
                        </div>
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

            {/* Filters Row: Search Input, Status Filter & Task Dropdown */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
              {/* Search Filter Input */}
              <div className="relative flex-1 min-w-[220px]">
                <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
                <input
                  type="search"
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                  placeholder="Search applicants by name, ID, or email..."
                  className="w-full rounded-xl border border-border bg-input py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* Application Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Status:</span>
                {['all', 'Pending', 'Approved', 'Completed', 'Rejected'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setAppStatusFilter(status)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
                      appStatusFilter.toLowerCase() === status.toLowerCase()
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-muted'
                    }`}
                  >
                    {status === 'all' ? 'All' : status}
                  </button>
                ))}
              </div>

              {/* Task Filter Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 shrink-0">
                  <i className="ti ti-filter text-primary text-xs" /> Task:
                </label>
                <select
                  value={selectedTaskFilter}
                  onChange={(e) => setSelectedTaskFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="rounded-xl border border-border bg-input px-3.5 py-1.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="all">All Tasks & Events ({applications.length} total)</option>
                  {tasks.map(t => {
                    const count = applications.filter(a => a.taskID === t.id).length
                    return (
                      <option key={t.id} value={t.id}>
                        Task #{t.id} - {t.title} ({count})
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* Active Task Filter Banner */}
            {selectedTaskFilter !== 'all' && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-primary/40 bg-primary/10 text-xs text-foreground shadow-2xs">
                <span className="font-semibold flex items-center gap-2">
                  <i className="ti ti-filter text-primary text-sm" />
                  Showing applicants for Task #{selectedTaskFilter}: <strong className="text-primary font-bold">{tasks.find(t => t.id === selectedTaskFilter)?.title || `Task #${selectedTaskFilter}`}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTaskFilter('all')}
                  className="rounded-lg bg-primary/20 px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary/30 transition-colors"
                >
                  ✕ Show All Tasks
                </button>
              </div>
            )}

            {filteredAdminApps.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/60 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3">App ID</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Student ID</th>
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

                        const studentInfo = allStudentsList.find(s =>
                          (s.studentid || s.id)?.toUpperCase() === app.studentID?.toUpperCase()
                        )
                        const existingCC = studentInfo?.ccBalance || studentInfo?.creditcoins || 100
                        const departmentName = studentInfo?.department || 'Computer Science'
                        const semesterNum = studentInfo?.semester || 1
                        const collegeCodeVal = studentInfo?.collegecode || collegeCode || 'JHC'

                        return (
                          <tr key={app.applicationID} className="hover:bg-secondary/30 transition-colors group/row">
                            <td className="px-4 py-3.5 font-bold text-foreground">
                              #{app.applicationID}
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-foreground relative group/student cursor-pointer">
                              <div className="flex items-center gap-1.5">
                                <span>{app.name}</span>
                                <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-coin">
                                  {existingCC} CC
                                </span>
                              </div>

                              {/* Student Hover Preview Card Popover */}
                              <div className="pointer-events-none opacity-0 group-hover/student:opacity-100 transition-all duration-200 ease-out transform group-hover/student:translate-y-0 translate-y-1 absolute left-4 top-full z-50 mt-1 w-72 rounded-2xl border border-primary/30 bg-card p-4 shadow-2xl backdrop-blur-md">
                                <div className="flex items-center justify-between pb-2 border-b border-border">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                      {getInitials(app.name)}
                                    </div>
                                    <div className="min-w-0">
                                      <h5 className="font-bold text-foreground text-xs leading-tight truncate">{app.name}</h5>
                                      <p className="text-[10px] text-muted-foreground truncate">{app.studentID}</p>
                                    </div>
                                  </div>
                                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-coin flex items-center gap-1 shrink-0">
                                    <i className="ti ti-coin text-xs" />
                                    {existingCC} CC
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2.5 text-[11px]">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">Class / Dept</span>
                                    <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5 truncate">
                                      <i className="ti ti-building text-primary text-xs shrink-0" />
                                      {departmentName}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">Semester</span>
                                    <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                                      <i className="ti ti-school text-primary text-xs shrink-0" />
                                      Sem {semesterNum} ({collegeCodeVal})
                                    </span>
                                  </div>
                                  <div className="col-span-2 pt-1 border-t border-border/50">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">Email Address</span>
                                    <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5 truncate text-[11px]">
                                      <i className="ti ti-mail text-primary text-xs shrink-0" />
                                      <span className="truncate">{app.email}</span>
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-border/80 flex items-center justify-between text-[10px]">
                                  <span className="text-muted-foreground">Applied for:</span>
                                  <span className="font-semibold text-primary truncate max-w-[150px]">{app.title}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-medium text-muted-foreground">
                              {app.studentID}
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
                              <div className="flex items-center justify-end gap-2">
                                {isPending && (
                                  <>
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
                                  </>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isApproved || isCompleted) {
                                      setTargetChatStudentId(app.studentID)
                                      setActiveTab('chat')
                                    } else {
                                      alert(`Please approve ${app.name}'s application first to enable student chat.`)
                                    }
                                  }}
                                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                                    isApproved || isCompleted
                                      ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 shadow-2xs'
                                      : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
                                  }`}
                                  title={isApproved || isCompleted ? 'Open Chat Channel' : 'Approve application to enable chat'}
                                >
                                  <i className="ti ti-message text-xs" />
                                  Chat
                                </button>
                              </div>
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

function AdminChatSection({
  adminId,
  initialStudentId,
  onNavigateToApplicants,
  onNavigateToAllocateCC
}: {
  adminId: string
  initialStudentId?: string | null
  onNavigateToApplicants?: (studentId?: string) => void
  onNavigateToAllocateCC?: (studentId?: string) => void
}) {
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [contactSearchQuery, setContactSearchQuery] = useState('')
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
        if (data.length > 0) {
          if (initialStudentId) {
            const match = data.find(c => (c.id || c.studentid)?.toUpperCase() === initialStudentId.toUpperCase())
            setSelectedStudent(match || data[0])
          } else if (!selectedStudent) {
            setSelectedStudent(data[0])
          }
        }
      }
    } catch (err) {
      console.error('Error fetching admin chat contacts:', err)
    } finally {
      setLoadingContacts(false)
    }
  }, [adminId, selectedStudent, initialStudentId])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  useEffect(() => {
    if (initialStudentId && contacts.length > 0) {
      const match = contacts.find(c => (c.id || c.studentid)?.toUpperCase() === initialStudentId.toUpperCase())
      if (match) {
        setSelectedStudent(match)
      }
    }
  }, [initialStudentId, contacts])

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

  const filteredContacts = contacts.filter((student) => {
    if (!contactSearchQuery.trim()) return true
    const q = contactSearchQuery.trim().toLowerCase()
    return (
      student.name?.toLowerCase().includes(q) ||
      student.id?.toLowerCase().includes(q) ||
      student.department?.toLowerCase().includes(q) ||
      student.approvedTasks?.some((t: any) => t.title?.toLowerCase().includes(q))
    )
  })

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
        <div className="p-3.5 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <i className="ti ti-messages text-primary text-base" aria-hidden="true" />
              Approved Students
            </h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {contacts.length} Active
            </span>
          </div>

          {/* Contact Search Filter */}
          <div className="relative">
            <i className="ti ti-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
            <input
              type="search"
              value={contactSearchQuery}
              onChange={(e) => setContactSearchQuery(e.target.value)}
              placeholder="Search chat contacts..."
              className="w-full rounded-lg border border-border bg-input py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((student) => {
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
            })
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border my-2">
              No contacts match search filter.
            </div>
          )}
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
            <button
              type="button"
              onClick={() => onNavigateToApplicants?.(selectedStudent?.id)}
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ti ti-users text-primary text-xs" />
              View Applications
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAllocateCC?.(selectedStudent?.id)}
              className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ti ti-award text-amber-500 text-xs" />
              Award CC
            </button>
            <span className="text-xs bg-secondary px-3 py-1 rounded-lg border border-border text-muted-foreground flex items-center gap-1.5 hidden sm:flex">
              <i className="ti ti-info-circle text-primary" aria-hidden="true" />
              Max 50 Words
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

