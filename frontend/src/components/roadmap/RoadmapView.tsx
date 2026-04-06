import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../store';
import { api, Roadmap, RoadmapPlanTask, ChatMessage } from '../../lib/api';
import { Map, Send, Trash2, Plus, Circle, ChevronDown, ChevronRight, Sparkles, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UiMessage {
  role: 'user' | 'assistant';
  text: string;
  plan?: RoadmapPlanTask[];
  isPlanMessage?: boolean;
}

export function RoadmapView() {
  const { addTasks, addListDirect } = useAppContext();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [uiMessages, setUiMessages] = useState<UiMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const saveChatToStorage = (roadmapId: string, ui: UiMessage[], history: ChatMessage[], plan: RoadmapPlanTask[] | null) => {
    localStorage.setItem(`chat_${roadmapId}`, JSON.stringify({ ui, history, plan }));
  };

  const loadChatFromStorage = (roadmapId: string): { ui: UiMessage[]; history: ChatMessage[]; plan: RoadmapPlanTask[] | null } | null => {
    try {
      const raw = localStorage.getItem(`chat_${roadmapId}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<RoadmapPlanTask[] | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getRoadmaps().then(setRoadmaps).catch(console.error);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [uiMessages, loading]);

  const handleCreateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    const roadmap = await api.createRoadmap({ goal: newGoal.trim() });
    setRoadmaps(prev => [roadmap, ...prev]);
    selectRoadmap(roadmap);
    setNewGoal('');
    setCreatingNew(false);
  };

  const selectRoadmap = (roadmap: Roadmap) => {
    setSelectedRoadmap(roadmap);
    setPendingPlan(null);

    const saved = loadChatFromStorage(roadmap.id);
    if (saved && saved.ui.length > 0) {
      setUiMessages(saved.ui);
      setChatHistory(saved.history);
      setPendingPlan(saved.plan);
      return;
    }

    const initialHistory: ChatMessage[] = [{ role: 'user', content: roadmap.goal }];
    setChatHistory(initialHistory);
    setUiMessages([{ role: 'user', text: roadmap.goal }]);
    setLoading(true);
    api.roadmapChat(roadmap.id, initialHistory)
      .then(res => {
        const aiMsg: UiMessage = { role: 'assistant', text: res.message, plan: res.plan, isPlanMessage: res.status === 'plan' };
        const newUi: UiMessage[] = [{ role: 'user', text: roadmap.goal }, aiMsg];
        const newHistory: ChatMessage[] = [...initialHistory, { role: 'assistant', content: res.message }];
        const newPlan = res.status === 'plan' && res.plan ? res.plan : null;
        setUiMessages(newUi);
        setChatHistory(newHistory);
        setPendingPlan(newPlan);
        saveChatToStorage(roadmap.id, newUi, newHistory, newPlan);
      })
      .catch(() => setUiMessages(prev => [...prev, { role: 'assistant', text: 'Ошибка при обращении к AI.' }]))
      .finally(() => setLoading(false));
  };

  const handleDeleteRoadmap = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.deleteRoadmap(id);
    localStorage.removeItem(`chat_${id}`);
    setRoadmaps(prev => prev.filter(r => r.id !== id));
    if (selectedRoadmap?.id === id) {
      setSelectedRoadmap(null);
      setUiMessages([]);
      setChatHistory([]);
      setPendingPlan(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedRoadmap || loading) return;

    const userText = input.trim();
    setInput('');

    const newUiMessages: UiMessage[] = [...uiMessages, { role: 'user', text: userText }];
    setUiMessages(newUiMessages);

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: userText }];
    setChatHistory(newHistory);
    setLoading(true);

    try {
      const res = await api.roadmapChat(selectedRoadmap.id, newHistory);

      const assistantMsg: UiMessage = {
        role: 'assistant',
        text: res.message,
        plan: res.plan,
        isPlanMessage: res.status === 'plan',
      };

      const updatedHistory = [...newHistory, { role: 'assistant' as const, content: res.message }];
      const newPlan = res.status === 'plan' && res.plan ? res.plan : null;
      const updatedUi = [...newUiMessages, assistantMsg];
      setUiMessages(updatedUi);
      setChatHistory(updatedHistory);
      if (newPlan) setPendingPlan(newPlan);
      saveChatToStorage(selectedRoadmap.id, updatedUi, updatedHistory, newPlan);
    } catch {
      setUiMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Ошибка при обращении к AI. Попробуй ещё раз.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingPlan || !selectedRoadmap || confirming) return;
    setConfirming(true);
    try {
      const result = await api.confirmRoadmap(selectedRoadmap.id, {
        goal: selectedRoadmap.goal,
        plan: pendingPlan,
      });
      addListDirect(result.list);
      addTasks(result.tasks);
      setPendingPlan(null);
      setUiMessages(prev => {
        const doneMsg: UiMessage = { role: 'assistant', text: `✅ Создан список «${result.list.title}» с ${result.tasks.length} задачами. Можешь найти их в боковом меню.` };
        const updated = [...prev, doneMsg];
        saveChatToStorage(selectedRoadmap.id, updated, chatHistory, null);
        return updated;
      });
    } catch {
      setUiMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Не удалось создать задачи. Попробуй ещё раз.',
      }]);
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = () => {
    setPendingPlan(null);
    setUiMessages(prev => {
      const msg: UiMessage = { role: 'assistant', text: 'Хорошо, давай скорректируем план. Что именно хочешь изменить?' };
      const updated = [...prev, msg];
      if (selectedRoadmap) saveChatToStorage(selectedRoadmap.id, updated, chatHistory, null);
      return updated;
    });
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Map className="w-5 h-5" />
            Роадмапы
          </div>
          <button
            onClick={() => setCreatingNew(true)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {creatingNew && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateRoadmap}
              className="p-3 border-b border-border overflow-hidden"
            >
              <input
                autoFocus
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                placeholder="Название цели..."
                className="w-full text-sm bg-secondary rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={e => e.key === 'Escape' && setCreatingNew(false)}
              />
              <div className="flex gap-2 mt-2">
                <button type="submit" className="flex-1 text-xs bg-primary text-primary-foreground rounded-lg py-1.5 font-medium">
                  Создать
                </button>
                <button type="button" onClick={() => setCreatingNew(false)} className="flex-1 text-xs bg-secondary rounded-lg py-1.5">
                  Отмена
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex-1 py-2">
          {roadmaps.length === 0 && !creatingNew && (
            <p className="text-xs text-muted-foreground text-center mt-8 px-4">
              Нет роадмапов. Нажми + чтобы создать.
            </p>
          )}
          {roadmaps.map(r => (
            <button
              key={r.id}
              onClick={() => selectRoadmap(r)}
              className={cn(
                'w-full text-left px-4 py-3 flex items-start justify-between gap-2 hover:bg-secondary/60 transition-colors group',
                selectedRoadmap?.id === r.id && 'bg-secondary'
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.goal}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(r.created_at), 'd MMM', { locale: ru })}
                </p>
              </div>
              <button
                onClick={e => handleDeleteRoadmap(r.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-destructive transition-all flex-shrink-0 mt-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      {selectedRoadmap ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex-shrink-0">
            <h2 className="font-semibold text-lg truncate">{selectedRoadmap.goal}</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {uiMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border rounded-bl-sm'
                )}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1.5 text-xs text-muted-foreground font-medium">
                      <Sparkles className="w-3 h-3" /> AI
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {msg.isPlanMessage && msg.plan && msg.plan.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {msg.plan.map((task, ti) => (
                        <PlanTaskCard key={ti} task={task} />
                      ))}
                      {pendingPlan && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={handleConfirm}
                            disabled={confirming}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-xl py-2 text-xs font-medium disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {confirming ? 'Создаём...' : 'Подтвердить и создать'}
                          </button>
                          <button
                            onClick={handleReject}
                            disabled={confirming}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-secondary rounded-xl py-2 text-xs font-medium disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Изменить план
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-2">
                    <Sparkles className="w-3 h-3" /> AI
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-6 py-4 border-t border-border flex-shrink-0">
            <div className="flex gap-3 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder="Опиши цель или ответь на вопрос AI..."
                rows={2}
                className="flex-1 resize-none bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="p-3 bg-primary text-primary-foreground rounded-xl disabled:opacity-40 hover:opacity-90 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Enter — отправить, Shift+Enter — новая строка</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <Map className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground font-medium">Выбери роадмап или создай новый</p>
            <p className="text-sm text-muted-foreground mt-1">AI уточнит детали и составит план задач</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanTaskCard({ task }: { task: RoadmapPlanTask; key?: React.Key }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-background/60 border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={() => task.subtasks.length > 0 && setOpen(o => !o)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-left',
          task.subtasks.length > 0 && 'hover:bg-secondary/40 transition-colors'
        )}
      >
        <Circle className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium">{task.title}</span>
        {task.subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {task.subtasks.length}
            {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 space-y-1 border-t border-border/40 pt-2">
              {task.subtasks.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
                  <Circle className="w-3 h-3 flex-shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
