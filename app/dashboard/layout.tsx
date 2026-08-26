'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import RightPanel from '@/components/RightPanel'
import {
  getTasks,
  getStudentApplications,
  applyForTask,
  deleteApplication,
  completeTask,
  getStudentPortfolio,
  getStudentDetails,
  getLeaderboard
} from '@/lib/api'

// Initial data fallback
export const TASKS = [
  {
    id: 1,
    title: 'Design poster for Tech Fest 2025',
    description: 'Create an A3 poster for the annual tech festival including event schedule and sponsor logos',
    department: 'CSE Dept',
    cc: 20,
    deadline: 'Nov 28',
    tags: ['Graphic Design', 'Canva'],
    urgent: false,
    category: 'Design',
    status: 'open',
  },
]

const INITIAL_APPLIED_TASK_IDS: number[] = []
const INITIAL_COMPLETED_TASK_IDS: number[] = []
const INITIAL_PORTFOLIO: any[] = []
const TRANSACTIONS: any[] = []

// Create Context
interface DashboardContextType {
  user: any
  tasks: typeof TASKS
  appliedTaskIds: number[]
  completedTaskIds: number[]
  portfolio: any[]
  leaderboard: any[]
  transactions: any[]
  notifications: any[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleApply: (taskId: number) => Promise<void>
  handleUnapply: (taskId: number) => Promise<void>
  handleMarkComplete: (taskId: number) => Promise<void>
  refreshData: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

// Hook to use Context
export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardLayout')
  }
  return context
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<any[]>(TASKS)
  const [appliedTaskIds, setAppliedTaskIds] = useState<number[]>(INITIAL_APPLIED_TASK_IDS)
  const [completedTaskIds, setCompletedTaskIds] = useState<number[]>(INITIAL_COMPLETED_TASK_IDS)
  const [portfolio, setPortfolio] = useState<any[]>(INITIAL_PORTFOLIO)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>(TRANSACTIONS)
  const [notifications, setNotifications] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Determine active page from pathname
  const getActivePageFromPath = () => {
    const pathParts = pathname.split('/')
    const lastPart = pathParts[pathParts.length - 1]
    if (lastPart === 'dashboard' || lastPart === '') return 'all-tasks'
    return lastPart
  }

  const activePage = getActivePageFromPath()
  const activeTopNav = activePage === 'all-tasks' ? 'explore' : activePage

  const refreshData = useCallback(async () => {
    const storedUser = localStorage.getItem('credimpact_user')
    if (!storedUser) return

    try {
      const parsedUser = JSON.parse(storedUser)
      const studentUid = parsedUser.uid || parsedUser.studentid

      // Load tasks from backend DB
      const apiTasks = await getTasks().catch(() => null)
      if (apiTasks && Array.isArray(apiTasks) && apiTasks.length > 0) {
        setTasks(apiTasks)
      }

      // Load leaderboard from backend DB
      const apiLeaderboard = await getLeaderboard().catch(() => null)
      if (apiLeaderboard && Array.isArray(apiLeaderboard)) {
        setLeaderboard(apiLeaderboard)
      }

      if (studentUid) {
        // Load student fresh details
        const freshUser = await getStudentDetails(studentUid).catch(() => null)
        if (freshUser) {
          const updatedUser = {
            ...parsedUser,
            ...freshUser,
            branch: freshUser.department || parsedUser.branch || '',
          }
          setUser(updatedUser)
          localStorage.setItem('credimpact_user', JSON.stringify(updatedUser))
        }

        // Load applications
        const apps = await getStudentApplications(studentUid).catch(() => [])
        if (Array.isArray(apps)) {
          const appliedIds: number[] = []
          const completedIds: number[] = []
          const txList: any[] = []
          const newNotifications: any[] = []

          const extraTasksFromApps: any[] = []
          apps.forEach((a: any) => {
            const taskIdVal = a.taskId || a.taskid
            if (a.task && a.task.title) {
              extraTasksFromApps.push({
                id: taskIdVal,
                taskid: taskIdVal,
                title: a.task.title,
                description: a.task.description || '',
                cc: a.task.cc || 50,
                creditcoins: a.task.cc || 50,
                deadline: a.task.deadline || 'Completed',
                status: a.status,
                department: a.task.department || 'Campus',
                urgent: false,
                category: a.task.category || 'General',
                tags: a.task.tags || ['Completed']
              })
            }

            if (a.status === 'Completed') {
              completedIds.push(taskIdVal)
              txList.push({
                id: a.applicationid || taskIdVal,
                type: 'earned',
                amount: a.task?.cc || 50,
                description: `Completed task: ${a.task?.title || 'Campus Task'}`,
                date: a.applieddate || 'Recent'
              })
            } else {
              appliedIds.push(taskIdVal)
            }

            const approverName = a.task?.createdby || 'Faculty'
            if (a.status === 'Approved') {
              newNotifications.push({
                id: `approved-${taskIdVal}-${a.applicationid || ''}`,
                type: `approved`,
                title: a.task?.title || 'Task approved',
                text: `Your application for "${a.task?.title || 'this task'}" has been approved. Admin chat unlocked!`,
                approver: approverName,
                taskId: taskIdVal
              })
            }

            if (a.status === 'Pending') {
              newNotifications.push({
                id: `reminder-${taskIdVal}-${a.applicationid || ''}`,
                type: 'reminder',
                title: a.task?.title || 'Task reminder',
                text: `Reminder: "${a.task?.title || 'this task'}" is still pending.`,
                approver: approverName,
                taskId: taskIdVal
              })
            }
          })

          setAppliedTaskIds(appliedIds)
          setCompletedTaskIds(completedIds)
          setNotifications(newNotifications)

          if (extraTasksFromApps.length > 0) {
            setTasks((prevTasks) => {
              const taskMap = new Map(prevTasks.map(t => [t.id, t]))
              extraTasksFromApps.forEach(t => {
                if (!taskMap.has(t.id)) {
                  taskMap.set(t.id, t)
                }
              })
              return Array.from(taskMap.values())
            })
          }
          if (txList.length > 0) {
            setTransactions(txList)
          }
        }

        // Load portfolio
        const portData = await getStudentPortfolio(studentUid).catch(() => null)
        if (portData && Array.isArray(portData.items)) {
          setPortfolio(portData.items)
        }
      }
    } catch (err) {
      console.error('Error refreshing dashboard realtime data:', err)
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
      setUser({
        ...parsedUser,
        branch: parsedUser.branch || parsedUser.department || '',
        year: parsedUser.year || '',
        division: parsedUser.division || '',
        photo: parsedUser.photo || null
      })
    } catch {
      router.push('/login')
      return
    } finally {
      setLoading(false)
    }
  }, [router])

  // Real-time polling effect (syncs database every 5 seconds)
  useEffect(() => {
    if (!loading && user) {
      refreshData()
      const interval = setInterval(() => {
        refreshData()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [loading, user?.uid, refreshData])

  const handleSidebarItemClick = (itemId: string) => {
    if (itemId === 'logout') {
      localStorage.removeItem('credimpact_user')
      router.push('/login')
      return
    }
    if (itemId === 'all-tasks') {
      router.push('/dashboard')
    } else {
      router.push(`/dashboard/${itemId}`)
    }
  }

  const handleTopNavClick = (itemId: string) => {
    if (itemId === 'explore') {
      router.push('/dashboard')
    } else if (itemId === 'my-tasks') {
      router.push('/dashboard/applied')
    } else if (itemId === 'analytics') {
      router.push('/dashboard/analytics')
    } else if (itemId === 'portfolio') {
      router.push('/dashboard/my-portfolio')
    } else if (itemId === 'profile') {
      router.push('/dashboard/profile')
    }
  }

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleApply = async (taskId: number) => {
    if (!user) return
    const studentUid = user.uid || user.studentid
    if (!studentUid) return

    try {
      const res = await applyForTask(studentUid, taskId)
      const msg = res?.message || 'Application Submitted'
      setToastMessage({ type: 'success', text: msg })
      setAppliedTaskIds((prev) => (prev.includes(taskId) ? prev : [...prev, taskId]))
      setTimeout(() => setToastMessage(null), 4000)
      await refreshData()
    } catch (err: any) {
      const msg = err.message || 'You have already applied for this task.'
      setToastMessage({ type: 'error', text: msg })
      setTimeout(() => setToastMessage(null), 4000)
      if (!appliedTaskIds.includes(taskId) && !completedTaskIds.includes(taskId)) {
        setAppliedTaskIds([...appliedTaskIds, taskId])
      }
    }
  }

  const handleUnapply = async (taskId: number) => {
    if (!user) return
    const studentUid = user.uid || user.studentid
    if (!studentUid) return

    try {
      const res = await deleteApplication(studentUid, taskId)
      const msg = res?.message || 'Application withdrawn successfully'
      setToastMessage({ type: 'success', text: msg })
      setAppliedTaskIds((prev) => prev.filter((id) => id !== taskId))
      setTimeout(() => setToastMessage(null), 4000)
      await refreshData()
    } catch (err: any) {
      const msg = err.message || 'Unable to withdraw application.'
      setToastMessage({ type: 'error', text: msg })
      setTimeout(() => setToastMessage(null), 4000)
    }
  }

  const handleMarkComplete = async (taskId: number) => {
    if (!user) return
    const studentUid = user.uid || user.studentid
    if (!studentUid) return

    try {
      await completeTask(studentUid, taskId)
      setToastMessage({ type: 'success', text: 'Task marked as complete!' })
      setTimeout(() => setToastMessage(null), 3000)
      await refreshData()
    } catch (err) {
      console.error('Error completing task:', err)
      if (!completedTaskIds.includes(taskId)) {
        setCompletedTaskIds([...completedTaskIds, taskId])
        setAppliedTaskIds(appliedTaskIds.filter(id => id !== taskId))
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardContext.Provider value={{
      user,
      tasks,
      appliedTaskIds,
      completedTaskIds,
      portfolio,
      leaderboard,
      transactions,
      notifications,
      searchQuery,
      setSearchQuery,
      handleApply,
      handleUnapply,
      handleMarkComplete,
      refreshData
    }}>
      <div className="min-h-screen bg-background">
        <TopNav
          user={user}
          activeNav={activeTopNav}
          onNavClick={handleTopNavClick}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          notifications={notifications}
        />

        {toastMessage && (
          <div className="fixed top-16 right-4 z-50 animate-bounce">
            <div className={`rounded-xl px-4 py-2.5 shadow-lg border text-xs font-semibold flex items-center gap-2 ${toastMessage.type === 'success'
                ? 'bg-green-600 border-green-500 text-white'
                : 'bg-amber-600 border-amber-500 text-white'
              }`}>
              <i className={`ti ${toastMessage.type === 'success' ? 'ti-circle-check' : 'ti-alert-circle'} text-base`} aria-hidden="true" />
              {toastMessage.text}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-[1128px] px-4 py-4">
          <div className="flex gap-4">
            <Sidebar
              user={user}
              activeItem={activePage}
              onItemClick={handleSidebarItemClick}
            />
            <main className={`min-w-0 flex-1 ${activePage === 'chat' || activePage === 'analytics' ? 'max-w-[870px]' : 'max-w-[640px]'}`}>
              {children}
            </main>
            {activePage !== 'chat' && activePage !== 'analytics' && <RightPanel />}
          </div>
        </div>
      </div>
    </DashboardContext.Provider>
  )
}
