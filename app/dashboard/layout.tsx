'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import RightPanel from '@/components/RightPanel'

// Initial data
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
  {
    id: 2,
    title: 'Fix bug in student portal login page',
    description: 'The login redirect is broken after recent server update. Need a React developer to debug and fix the issue',
    department: 'IT Dept',
    cc: 30,
    deadline: 'Nov 22',
    tags: ['React', 'JavaScript'],
    urgent: true,
    category: 'Coding',
    status: 'open',
  },
  {
    id: 3,
    title: 'Write content for college newsletter',
    description: 'Draft 3 short articles of 200 words each covering recent college events for the monthly newsletter',
    department: 'Admin',
    cc: 15,
    deadline: 'Nov 30',
    tags: ['Content Writing', 'Editing'],
    urgent: false,
    category: 'Content Writing',
    status: 'open',
  },
  {
    id: 4,
    title: 'Edit video for Annual Report presentation',
    description: 'Cut and compile 4 raw clips into a 3 minute department highlights reel with captions and transitions',
    department: 'Mech Dept',
    cc: 25,
    deadline: 'Dec 2',
    tags: ['Video Editing', 'Premiere'],
    urgent: false,
    category: 'Design',
    status: 'open',
  },
  {
    id: 5,
    title: 'Volunteer at registration desk Cultural Fest',
    description: 'Manage student check ins at the cultural fest registration counter from 9am to 1pm on Dec 5',
    department: 'CSE Dept',
    cc: 18,
    deadline: 'Dec 5',
    tags: ['Event Help', 'On Campus'],
    urgent: false,
    category: 'Event Help',
    status: 'open',
  },
  {
    id: 6,
    title: 'Digitise 50 handwritten catalogue entries',
    description: 'Type up scanned handwritten book entries into the library Excel sheet with high accuracy',
    department: 'Library',
    cc: 12,
    deadline: 'Dec 10',
    tags: ['Data Entry', 'Excel'],
    urgent: false,
    category: 'Data Entry',
    status: 'open',
  },
  {
    id: 7,
    title: 'Create social media posts for placement cell',
    description: 'Design 5 Instagram posts announcing upcoming placement drives with company logos and key details',
    department: 'Placement Cell',
    cc: 22,
    deadline: 'Nov 25',
    tags: ['Graphic Design', 'Instagram'],
    urgent: true,
    category: 'Design',
    status: 'open',
  },
  {
    id: 8,
    title: 'Translate notice board announcements to Hindi',
    description: 'Translate 8 official college announcements from English to Hindi for the Hindi notice board display',
    department: 'Admin',
    cc: 10,
    deadline: 'Nov 27',
    tags: ['Translation', 'Content Writing'],
    urgent: false,
    category: 'Content Writing',
    status: 'open',
  },
]

const INITIAL_APPLIED_TASK_IDS = [2, 3]
const INITIAL_COMPLETED_TASK_IDS = [1]
const INITIAL_PORTFOLIO = [
  {
    id: 1,
    title: 'Tech Fest 2024 Poster Design',
    description: 'Designed the official poster for Tech Fest 2024',
    ccEarned: 35,
    date: 'Oct 15, 2024',
    tags: ['Graphic Design', 'Canva'],
  },
]

const TRANSACTIONS = [
  { id: 1, type: 'earned', amount: 20, description: 'Poster design for Tech Fest 2024', date: 'Oct 15, 2024' },
  { id: 2, type: 'earned', amount: 15, description: 'Content writing for newsletter', date: 'Oct 10, 2024' },
]

// Create Context
interface DashboardContextType {
  user: any
  tasks: typeof TASKS
  appliedTaskIds: number[]
  completedTaskIds: number[]
  portfolio: typeof INITIAL_PORTFOLIO
  transactions: typeof TRANSACTIONS
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleApply: (taskId: number) => void
  handleMarkComplete: (taskId: number) => void
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
  const [tasks, setTasks] = useState(TASKS)
  const [appliedTaskIds, setAppliedTaskIds] = useState(INITIAL_APPLIED_TASK_IDS)
  const [completedTaskIds, setCompletedTaskIds] = useState(INITIAL_COMPLETED_TASK_IDS)
  const [portfolio, setPortfolio] = useState(INITIAL_PORTFOLIO)
  const [transactions, setTransactions] = useState(TRANSACTIONS)
  const [searchQuery, setSearchQuery] = useState('')

  // Determine active page from pathname
  const getActivePageFromPath = () => {
    const pathParts = pathname.split('/')
    const lastPart = pathParts[pathParts.length - 1]
    if (lastPart === 'dashboard' || lastPart === '') return 'all-tasks'
    return lastPart
  }

  const activePage = getActivePageFromPath()

  useEffect(() => {
    const storedUser = localStorage.getItem('credimpact_user')
    if (!storedUser) {
      router.push('/login')
      return
    }

    try {
      setUser(JSON.parse(storedUser))
    } catch {
      router.push('/login')
      return
    } finally {
      setLoading(false)
    }
  }, [router])

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

  const handleApply = (taskId: number) => {
    if (!appliedTaskIds.includes(taskId) && !completedTaskIds.includes(taskId)) {
      setAppliedTaskIds([...appliedTaskIds, taskId])
    }
  }

  const handleMarkComplete = (taskId: number) => {
    if (!completedTaskIds.includes(taskId)) {
      setCompletedTaskIds([...completedTaskIds, taskId])
      // Remove from applied if there
      setAppliedTaskIds(appliedTaskIds.filter(id => id !== taskId))
      // Add to transactions
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        setTransactions([
          { id: Date.now(), type: 'earned', amount: task.cc, description: `Completed task: ${task.title}`, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
          ...transactions,
        ])
        // Add to portfolio
        setPortfolio([
          {
            id: Date.now(),
            title: task.title,
            description: task.description,
            ccEarned: task.cc,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            tags: task.tags,
          },
          ...portfolio,
        ])
        // Update user's CC balance
        setUser(prev => ({ ...prev, ccBalance: (prev.ccBalance || 0) + task.cc }))
        // Update task status
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t))
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
      transactions,
      searchQuery,
      setSearchQuery,
      handleApply,
      handleMarkComplete
    }}>
      <div className="min-h-screen bg-background">
        <TopNav
          user={user}
          activeNav="explore"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <div className="mx-auto max-w-[1128px] px-4 py-4">
          <div className="flex gap-4">
            <Sidebar
              user={user}
              activeItem={activePage}
              onItemClick={handleSidebarItemClick}
            />
            <main className="min-w-0 flex-1 max-w-[640px]">
              {children}
            </main>
            <RightPanel />
          </div>
        </div>
      </div>
    </DashboardContext.Provider>
  )
}
