'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash2, GitBranch, Globe, Calendar, Target,
  Check, X, BarChart3, Rocket, 
} from 'lucide-react' 

interface Project {
  id: string
  idea_id: string | null
  title: string
  description: string
  status: string
  progress: number
  github_url: string
  demo_url: string
  tech_stack: string[]
  start_date: string
  target_date: string
  created_at: string
}

interface Task {
  id: string
  project_id: string
  title: string
  done: boolean
}

const STATUS_OPTIONS = ['planning', 'in-progress', 'paused', 'completed']
const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-yellow-500/20 text-yellow-400',
  'in-progress': 'bg-blue-500/20 text-blue-400',
  paused: 'bg-gray-500/20 text-gray-400',
  completed: 'bg-green-500/20 text-green-400',
}

export default function TrackerPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [editingProgress, setEditingProgress] = useState(false)
  const [savedIdeas, setSavedIdeas] = useState<any[]>([])
  const [form, setForm] = useState({
    title: '', description: '', status: 'planning',
    progress: 0, github_url: '', demo_url: '',
    tech_stack: '', start_date: '', target_date: '', idea_id: ''
  })
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadProjects()
    loadSavedIdeas()
  }, [])

  async function loadProjects() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  async function loadSavedIdeas() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('saved_ideas')
      .select('*, idea:ideas(title)')
      .eq('user_id', user.id)
    setSavedIdeas(data || [])
  }

  async function loadTasks(projectId: string) {
    const { data } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setTasks(data || [])
  }

  async function createProject() {
    if (!form.title.trim()) { toast.error('Enter a title'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('projects').insert({
      user_id: user.id,
      title: form.title,
      description: form.description,
      status: form.status,
      progress: form.progress,
      github_url: form.github_url,
      demo_url: form.demo_url,
      tech_stack: form.tech_stack ? form.tech_stack.split(',').map(t => t.trim()) : [],
      start_date: form.start_date || null,
      target_date: form.target_date || null,
      idea_id: form.idea_id || null
    }).select().single()

    if (error) { toast.error('Failed to create project'); return }
    setProjects(prev => [data, ...prev])
    setShowCreate(false)
    setForm({ title: '', description: '', status: 'planning', progress: 0, github_url: '', demo_url: '', tech_stack: '', start_date: '', target_date: '', idea_id: '' })
    toast.success('Project created!')
    openProject(data)
  }

  async function updateProject(id: string, updates: Partial<Project>) {
    const { error } = await supabase.from('projects').update(updates).eq('id', id)
    if (error) { toast.error('Failed to update'); return }
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    if (selectedProject?.id === id) setSelectedProject(prev => prev ? { ...prev, ...updates } : null)
    toast.success('Updated!')
  }

  async function deleteProject(id: string) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) { toast.error('Failed'); return }
    setProjects(prev => prev.filter(p => p.id !== id))
    if (selectedProject?.id === id) setSelectedProject(null)
    toast.success('Project deleted')
  }

  async function addTask() {
    if (!newTask.trim() || !selectedProject) return
    const { data, error } = await supabase.from('project_tasks').insert({
      project_id: selectedProject.id,
      title: newTask.trim(),
      done: false
    }).select().single()
    if (error) { toast.error('Failed'); return }
    setTasks(prev => [...prev, data])
    setNewTask('')
  }

  async function toggleTask(task: Task) {
    const { error } = await supabase.from('project_tasks')
      .update({ done: !task.done }).eq('id', task.id)
    if (error) return
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))
  }

  async function deleteTask(id: string) {
    await supabase.from('project_tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function openProject(project: Project) {
    setSelectedProject(project)
    loadTasks(project.id)
  }

  const completedTasks = tasks.filter(t => t.done).length
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white p-6">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Project Tracker</h1>
            <p className="dark:text-gray-400 text-gray-500">Track your project ideas from start to launch</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <Plus size={15} />
            New project
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: projects.length, color: 'text-orange-500' },
            { label: 'In Progress', value: projects.filter(p => p.status === 'in-progress').length, color: 'text-blue-400' },
            { label: 'Completed', value: projects.filter(p => p.status === 'completed').length, color: 'text-green-400' },
            { label: 'Planned', value: projects.filter(p => p.status === 'planning').length, color: 'text-yellow-400' },
          ].map(stat => (
            <div key={stat.label} className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
              <p className="dark:text-gray-400 text-gray-500 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="dark:bg-gray-900 bg-white border dark:border-gray-700 border-orange-200 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="font-semibold mb-4 dark:text-white text-gray-900">New project</h3>
              <div className="space-y-3">
                <input placeholder="Project title *" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                <textarea placeholder="Description" value={form.description} rows={2}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 resize-none" />

                {savedIdeas.length > 0 && (
                  <select value={form.idea_id} onChange={e => setForm(p => ({ ...p, idea_id: e.target.value }))}
                    className="w-full dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500">
                    <option value="">Link to a saved idea (optional)</option>
                    {savedIdeas.map(s => (
                      <option key={s.idea_id} value={s.idea_id}>{s.idea?.title}</option>
                    ))}
                  </select>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="GitHub URL" value={form.github_url}
                    onChange={e => setForm(p => ({ ...p, github_url: e.target.value }))}
                    className="dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                  <input placeholder="Demo URL" value={form.demo_url}
                    onChange={e => setForm(p => ({ ...p, demo_url: e.target.value }))}
                    className="dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <input placeholder="Tech stack (comma separated)" value={form.tech_stack}
                  onChange={e => setForm(p => ({ ...p, tech_stack: e.target.value }))}
                  className="w-full dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs dark:text-gray-500 text-gray-400 mb-1 block">Start date</label>
                    <input type="date" value={form.start_date}
                      onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                      className="w-full dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="text-xs dark:text-gray-500 text-gray-400 mb-1 block">Target date</label>
                    <input type="date" value={form.target_date}
                      onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))}
                      className="w-full dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 dark:bg-gray-800 bg-orange-50 dark:text-gray-300 text-gray-600 py-2.5 rounded-xl text-sm border dark:border-gray-700 border-orange-200 hover:border-orange-500 transition-colors">
                  Cancel
                </button>
                <button onClick={createProject}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Projects list */}
          <div className="lg:col-span-1">
            <h2 className="font-medium mb-4 dark:text-white text-gray-900">Projects ({projects.length})</h2>
            {loading ? (
              <p className="text-sm dark:text-gray-500 text-gray-400">Loading...</p>
            ) : projects.length === 0 ? (
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-8 text-center">
                <div className="w-10 h-10 rounded-xl dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-100 flex items-center justify-center mx-auto mb-3">
                  <Rocket size={18} className="text-orange-500" />
                </div>
                <p className="dark:text-gray-500 text-gray-400 text-sm mb-3">No projects yet</p>
                <button onClick={() => setShowCreate(true)} className="text-orange-500 hover:underline text-sm">
                  Create your first one
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map(project => (
                  <div key={project.id} onClick={() => openProject(project)}
                    className={`dark:bg-gray-900 bg-orange-50 border rounded-2xl p-4 cursor-pointer transition-all ${
                      selectedProject?.id === project.id
                        ? 'border-orange-500 dark:bg-orange-500/10'
                        : 'dark:border-gray-800 border-orange-100 hover:border-orange-500'
                    }`}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium dark:text-white text-gray-900 text-sm line-clamp-1 flex-1">{project.title}</p>
                      <button onClick={e => { e.stopPropagation(); deleteProject(project.id) }}
                        className="dark:text-gray-600 text-gray-400 hover:text-red-400 ml-2 shrink-0 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status]}`}>
                        {project.status}
                      </span>
                      <span className="text-xs dark:text-gray-500 text-gray-400">{project.progress}%</span>
                    </div>
                    <div className="w-full dark:bg-gray-800 bg-orange-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-orange-500 transition-all"
                        style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project detail */}
          <div className="lg:col-span-2">
            {!selectedProject ? (
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-16 text-center">
                <div className="w-12 h-12 rounded-2xl dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-100 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 size={20} className="dark:text-gray-600 text-gray-400" />
                </div>
                <p className="dark:text-gray-500 text-gray-400 text-sm">Select a project to view details</p>
              </div>
            ) : (
              <div className="space-y-4">

                {/* Project header */}
                <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-semibold dark:text-white text-gray-900">{selectedProject.title}</h2>
                    <select value={selectedProject.status}
                      onChange={e => updateProject(selectedProject.id, { status: e.target.value })}
                      className="text-xs dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-lg px-3 py-1.5 focus:outline-none focus:border-orange-500">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {selectedProject.description && (
                    <p className="dark:text-gray-400 text-gray-500 text-sm mb-4">{selectedProject.description}</p>
                  )}

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide">Progress</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium dark:text-white text-gray-900">{selectedProject.progress}%</span>
                        <button onClick={() => setEditingProgress(!editingProgress)}
                          className="text-xs text-orange-500 hover:underline">edit</button>
                      </div>
                    </div>
                    <div className="w-full dark:bg-gray-800 bg-orange-100 rounded-full h-2 mb-2">
                      <div className="h-2 rounded-full bg-orange-500 transition-all"
                        style={{ width: `${selectedProject.progress}%` }} />
                    </div>
                    {editingProgress && (
                      <input type="range" min="0" max="100" value={selectedProject.progress}
                        onChange={e => {
                          const val = parseInt(e.target.value)
                          setSelectedProject(prev => prev ? { ...prev, progress: val } : null)
                          setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, progress: val } : p))
                        }}
                        onMouseUp={() => { updateProject(selectedProject.id, { progress: selectedProject.progress }); setEditingProgress(false) }}
                        className="w-full accent-orange-500" />
                    )}
                  </div>

                  {/* Links */}
                  <div className="flex gap-3 flex-wrap">
                    {selectedProject.github_url && (
                      <a href={selectedProject.github_url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors">
                        <GitBranch size={12} /> GitHub
                      </a>
                    )}
                    {selectedProject.demo_url && (
                      <a href={selectedProject.demo_url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-orange-500/20 text-orange-500 px-3 py-1.5 rounded-lg hover:bg-orange-500/30 transition-colors border border-orange-500/20">
                        <Globe size={12} /> Live demo
                      </a>
                    )}
                    {selectedProject.start_date && (
                      <span className="flex items-center gap-1.5 text-xs dark:text-gray-400 text-gray-500 px-3 py-1.5 dark:bg-gray-800 bg-white rounded-lg border dark:border-gray-700 border-orange-100">
                        <Calendar size={12} /> Started {new Date(selectedProject.start_date).toLocaleDateString()}
                      </span>
                    )}
                    {selectedProject.target_date && (
                      <span className="flex items-center gap-1.5 text-xs dark:text-gray-400 text-gray-500 px-3 py-1.5 dark:bg-gray-800 bg-white rounded-lg border dark:border-gray-700 border-orange-100">
                        <Target size={12} /> Target {new Date(selectedProject.target_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Tech stack */}
                  {selectedProject.tech_stack?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedProject.tech_stack.map(tech => (
                        <span key={tech} className="bg-orange-500/20 text-orange-500 text-xs px-2 py-0.5 rounded-full border border-orange-500/20">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tasks */}
                <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium dark:text-white text-gray-900">
                      Tasks {tasks.length > 0 && `(${completedTasks}/${tasks.length})`}
                    </h3>
                    {tasks.length > 0 && (
                      <span className="text-xs dark:text-gray-500 text-gray-400">{taskProgress}% complete</span>
                    )}
                  </div>

                  {tasks.length > 0 && (
                    <div className="w-full dark:bg-gray-800 bg-orange-100 rounded-full h-1.5 mb-4">
                      <div className="h-1.5 rounded-full bg-green-500 transition-all"
                        style={{ width: `${taskProgress}%` }} />
                    </div>
                  )}

                  {/* Add task */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text" placeholder="Add a task..." value={newTask}
                      onChange={e => setNewTask(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTask()}
                      className="flex-1 dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 placeholder:dark:text-gray-600 placeholder:text-gray-400" />
                    <button onClick={addTask}
                      className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5">
                      <Plus size={14} /> Add
                    </button>
                  </div>

                  {tasks.length === 0 ? (
                    <p className="text-sm dark:text-gray-500 text-gray-400 text-center py-4">
                      No tasks yet. Add your first one above.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map(task => (
                        <div key={task.id}
                          className="flex items-center gap-3 p-3 dark:bg-gray-800 bg-white rounded-xl border dark:border-gray-700 border-orange-100">
                          <button onClick={() => toggleTask(task)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              task.done
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-400 hover:border-orange-500'
                            }`}>
                            {task.done && <Check size={10} strokeWidth={3} />}
                          </button>
                          <span className={`flex-1 text-sm ${task.done ? 'line-through dark:text-gray-500 text-gray-400' : 'dark:text-white text-gray-900'}`}>
                            {task.title}
                          </span>
                          <button onClick={() => deleteTask(task.id)}
                            className="dark:text-gray-600 text-gray-400 hover:text-red-400 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}