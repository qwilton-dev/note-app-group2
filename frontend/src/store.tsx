import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, Task, List, Step } from './lib/api';

export type { Task, List, Step };

interface AppState {
  tasks: Task[];
  lists: List[];
  loading: boolean;
  addTask: (data: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addList: (title: string) => Promise<void>;
  updateList: (id: string, title: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  addStep: (taskId: string, title: string) => Promise<void>;
  updateStep: (taskId: string, stepId: string, updates: Partial<Step>) => Promise<void>;
  deleteStep: (taskId: string, stepId: string) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getTasks(), api.getLists()])
      .then(([fetchedTasks, fetchedLists]) => {
        if (cancelled) return;
        setTasks(fetchedTasks);
        setLists(fetchedLists);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const addTask = useCallback(async (data: Partial<Task>) => {
    const task = await api.createTask(data);
    setTasks(prev => [task, ...prev]);
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    try {
      const updatedTask = await api.updateTask(id, updates);
      
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    } catch (error) {
      console.error("Ошибка при обновлении задачи:", error);
    }
  }, []);
  const deleteTask = useCallback(async (id: string) => {
    await api.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const addList = useCallback(async (title: string) => {
    const list = await api.createList(title);
    setLists(prev => [...prev, list]);
  }, []);

  const updateList = useCallback(async (id: string, title: string) => {
    const list = await api.updateList(id, title);
    setLists(prev => prev.map(l => l.id === id ? list : l));
  }, []);

  const deleteList = useCallback(async (id: string) => {
    await api.deleteList(id);
    setLists(prev => prev.filter(l => l.id !== id));
    setTasks(prev => prev.map(t => t.list_id === id ? { ...t, list_id: null } : t));
  }, []);

  const addStep = useCallback(async (taskId: string, title: string) => {
    const step = await api.createStep(taskId, title);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, steps: [...t.steps, step] } : t));
  }, []);

  const updateStep = useCallback(async (taskId: string, stepId: string, updates: Partial<Step>) => {
    const step = await api.updateStep(taskId, stepId, updates);
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, steps: t.steps.map(s => s.id === stepId ? step : s) } : t
    ));
  }, []);

  const deleteStep = useCallback(async (taskId: string, stepId: string) => {
    await api.deleteStep(taskId, stepId);
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, steps: t.steps.filter(s => s.id !== stepId) } : t
    ));
  }, []);

  return (
    <AppContext.Provider value={{
      tasks, lists, loading,
      addTask, updateTask, deleteTask,
      addList, updateList, deleteList,
      addStep, updateStep, deleteStep,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
}
