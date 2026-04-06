const BASE = import.meta.env.VITE_BACKEND_URL || ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  getMe: () => request<{ id: string; email: string; name: string; avatar: string | null; theme: string }>('/users/me'),
  updateMe: (body: { theme?: string }) => request<{ theme: string }>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),

  getLists: () => request<List[]>('/lists'),
  createList: (title: string) => request<List>('/lists', { method: 'POST', body: JSON.stringify({ title }) }),
  updateList: (id: string, title: string) => request<List>(`/lists/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  deleteList: (id: string) => request<void>(`/lists/${id}`, { method: 'DELETE' }),

  getTasks: () => request<Task[]>('/tasks'),
  createTask: (body: Partial<Task>) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id: string, body: Partial<Task>) => request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  createStep: (taskId: string, title: string) => request<Step>(`/tasks/${taskId}/steps`, { method: 'POST', body: JSON.stringify({ title }) }),
  updateStep: (taskId: string, stepId: string, body: Partial<Step>) => request<Step>(`/tasks/${taskId}/steps/${stepId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteStep: (taskId: string, stepId: string) => request<void>(`/tasks/${taskId}/steps/${stepId}`, { method: 'DELETE' }),

  getRoadmaps: () => request<Roadmap[]>('/roadmap'),
  createRoadmap: (body: RoadmapCreateInput) => request<Roadmap>('/roadmap', { method: 'POST', body: JSON.stringify(body) }),
  getRoadmap: (id: string) => request<Roadmap>(`/roadmap/${id}`),
  updateRoadmap: (id: string, body: RoadmapUpdateInput) => request<Roadmap>(`/roadmap/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteRoadmap: (id: string) => request<void>(`/roadmap/${id}`, { method: 'DELETE' }),
  roadmapChat: (id: string, messages: ChatMessage[]) => request<RoadmapChatOut>(`/roadmap/${id}/chat`, { method: 'POST', body: JSON.stringify({ messages }) }),
  confirmRoadmap: (id: string, body: RoadmapConfirmIn) => request<RoadmapGenerateOut>(`/roadmap/${id}/confirm`, { method: 'POST', body: JSON.stringify(body) }),
}

export interface Step {
  id: string
  task_id: string
  title: string
  is_completed: boolean
  position: number
}

export interface Task {
  id: string
  user_id: string
  list_id: string | null
  title: string
  is_completed: boolean
  is_important: boolean
  is_my_day: boolean
  due_date?: string
  note?: string
  completed_at?: string
  created_at: string
  order: number
  estimated_hours?: number
  steps: Step[]
}

export interface List {
  id: string
  user_id: string
  title: string
}

export interface Roadmap {
  id: string
  user_id: string
  goal: string
  context: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface RoadmapCreateInput {
  goal: string
  context?: string | null
}

export interface RoadmapUpdateInput {
  goal?: string | null
  context?: string | null
  is_completed?: boolean | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface RoadmapPlanTask {
  title: string
  subtasks: string[]
}

export interface RoadmapChatOut {
  status: 'clarify' | 'plan'
  message: string
  plan?: RoadmapPlanTask[]
}

export interface RoadmapConfirmIn {
  goal: string
  plan: RoadmapPlanTask[]
}

export interface RoadmapGenerateOut {
  tasks: Task[]
  list: List
}
