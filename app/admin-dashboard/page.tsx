'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
}

const initialTasks: Task[] = [
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
    applicants: ['Priya Mehta', 'Arjun Patel'],
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
    applicants: ['Rahul Sharma'],
    status: 'in-progress',
  },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTab, setActiveTab] = useState<'tasks' | 'applicants'>('tasks')
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    department: 'CSE Dept',
    cc: 10,
    deadline: '',
    tags: [],
    urgent: false,
    category: 'Design',
  })
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    const storedUser = localStorage.getItem('credimpact_user')
    if (!storedUser) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(storedUser)
    if (parsedUser.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setUser(parsedUser)
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('credimpact_user')
    router.push('/login')
  }

  const handleAddTask = () => {
    if (!newTask.title || !newTask.description || !newTask.deadline) {
      return
    }

    const task: Task = {
      id: tasks.length + 1,
      title: newTask.title,
      description: newTask.description,
      department: newTask.department || 'CSE Dept',
      cc: newTask.cc || 10,
      deadline: newTask.deadline,
      tags: newTask.tags || [],
      urgent: newTask.urgent || false,
      category: newTask.category || 'Design',
      applicants: [],
      status: 'open',
    }

    setTasks([...tasks, task])
    setShowAddTask(false)
    setNewTask({
      title: '',
      description: '',
      department: 'CSE Dept',
      cc: 10,
      deadline: '',
      tags: [],
      urgent: false,
      category: 'Design',
    })
    setTagInput('')
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

  const handleUpdateTaskStatus = (taskId: number, status: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status } : task
    ))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-[52px] max-w-[1200px] items-center justify-between px-4">
          <div className="text-[20px] font-semibold tracking-tight text-foreground">
            Cred<span className="text-primary">Impact</span>
            <span className="ml-2 text-xs text-muted-foreground font-normal">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-destructive hover:bg-secondary/80"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Manage Tasks
          </button>
          <button
            onClick={() => setActiveTab('applicants')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'applicants'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            View Applicants
          </button>
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">All Tasks</h2>
              <button
                onClick={() => setShowAddTask(true)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                + Add New Task
              </button>
            </div>

            {/* Add Task Modal */}
            {showAddTask && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-lg border border-border p-6 w-full max-w-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Add New Task</h3>
                    <button
                      onClick={() => setShowAddTask(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Task title"
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                      <textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="Task description"
                        rows={3}
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Department</label>
                        <select
                          value={newTask.department}
                          onChange={(e) => setNewTask({ ...newTask, department: e.target.value })}
                          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
                        >
                          <option value="CSE Dept">CSE Dept</option>
                          <option value="IT Dept">IT Dept</option>
                          <option value="Mech Dept">Mech Dept</option>
                          <option value="Admin">Admin</option>
                          <option value="Library">Library</option>
                          <option value="Placement Cell">Placement Cell</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">CC Reward</label>
                        <input
                          type="number"
                          value={newTask.cc}
                          onChange={(e) => setNewTask({ ...newTask, cc: parseInt(e.target.value) || 0 })}
                          placeholder="10"
                          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Deadline</label>
                        <input
                          type="text"
                          value={newTask.deadline}
                          onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                          placeholder="Dec 05"
                          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                        <select
                          value={newTask.category}
                          onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
                        >
                          <option value="Design">Design</option>
                          <option value="Coding">Coding</option>
                          <option value="Content Writing">Content Writing</option>
                          <option value="Event Help">Event Help</option>
                          <option value="Data Entry">Data Entry</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Tags (press Enter to add)
                      </label>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleAddTag}
                        placeholder="Add a tag"
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newTask.tags?.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs text-foreground"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="urgent"
                        checked={newTask.urgent}
                        onChange={(e) => setNewTask({ ...newTask, urgent: e.target.checked })}
                        className="rounded border-border"
                      />
                      <label htmlFor="urgent" className="text-sm font-medium text-foreground">
                        Mark as urgent
                      </label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setShowAddTask(false)}
                        className="flex-1 rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/80"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddTask}
                        className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">{task.title}</h3>
                        {task.urgent && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground">
                          {task.department}
                        </span>
                        <span className="rounded-full bg-secondary px-2 py-1 text-xs text-coin font-medium">
                          {task.cc} CC
                        </span>
                        <span className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground">
                          Deadline: {task.deadline}
                        </span>
                        {task.tags.map(tag => (
                          <span
                            key={tag}
                            className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        task.status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : task.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {task.status}
                      </span>
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                        className="rounded-md border border-border bg-input px-2 py-1 text-xs text-foreground"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  {task.applicants.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        {task.applicants.length} applicant{task.applicants.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {task.applicants.map(applicant => (
                          <span
                            key={applicant}
                            className="rounded-full bg-secondary px-2 py-1 text-xs text-foreground"
                          >
                            {applicant}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applicants Tab */}
        {activeTab === 'applicants' && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Applicants</h2>
            <div className="space-y-3">
              {tasks.filter(task => task.applicants.length > 0).map(task => (
                <div key={task.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-foreground">{task.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {task.applicants.length} applicant{task.applicants.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {task.applicants.map(applicant => (
                      <div key={applicant} className="flex justify-between items-center bg-secondary/50 rounded-md px-3 py-2">
                        <span className="text-sm text-foreground">{applicant}</span>
                        <div className="flex gap-2">
                          <button className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                            Accept
                          </button>
                          <button className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {tasks.filter(task => task.applicants.length > 0).length === 0 && (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <p className="text-muted-foreground">No applicants yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
