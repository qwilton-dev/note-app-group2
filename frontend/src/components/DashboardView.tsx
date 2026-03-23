import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext, Task } from '../store';
import { isToday, isPast, isFuture, format } from 'date-fns';
import { ru } from 'date-fns/locale'; 
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, AlertCircle, TrendingUp, LayoutDashboard, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { TaskDetail } from './TaskDetail';
import { AnimatePresence } from 'framer-motion';

const quotes = [
  "Секрет того, чтобы вырваться вперед, — это начать. – Марк Твен",
  "Все кажется невозможным, пока не будет сделано. – Нельсон Мандела",
  "Не смотри на часы; делай то же, что и они. Просто иди вперед. – Сэм Левенсон",
  "Будущее зависит от того, что вы делаете сегодня. – Махатма Ганди",
  "Не обязательно быть великим, чтобы начать, но нужно начать, чтобы стать великим. – Зиг Зиглар",
  "Успех не окончателен, неудача не фатальна: значение имеет лишь мужество продолжать. – Уинстон Черчилль",
  "Поверь, что можешь, и ты уже на полпути. – Теодор Рузвельт",
];

export function DashboardView() {
  const { tasks } = useAppContext();
  const [quote, setQuote] = useState(quotes[0]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  const stats = useMemo(() => {
    let todayTotal = 0, todayCompleted = 0, upcomingCount = 0, overdueCount = 0;

    tasks.forEach(task => {
      const isTaskToday = task.is_my_day || (task.due_date && isToday(new Date(task.due_date)));
      const isTaskOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && !task.is_completed;
      const isTaskUpcoming = task.due_date && isFuture(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && !task.is_completed;

      if (isTaskToday) { todayTotal++; if (task.is_completed) todayCompleted++; }
      if (isTaskOverdue) overdueCount++;
      if (isTaskUpcoming) upcomingCount++;
    });

    return { todayTotal, todayCompleted, upcomingCount, overdueCount, progress: todayTotal === 0 ? 0 : Math.round((todayCompleted / todayTotal) * 100) };
  }, [tasks]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  }, []);

  const upcomingTasks = useMemo(() =>
    tasks
      .filter(t => !t.is_completed && t.due_date && isFuture(new Date(t.due_date)) && !isToday(new Date(t.due_date)))
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 8),
    [tasks]
  );

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full gap-8 pb-10 overflow-y-auto">
        <header className="mt-4">
          <div className="flex items-center gap-3 text-3xl font-bold tracking-tight mb-6">
            <LayoutDashboard className="w-8 h-8" />
            <h1>Дашборд</h1>
          </div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold tracking-tight mb-3">
            {greeting}!
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground text-lg italic">
            "{quote}"
          </motion.p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="col-span-1 md:col-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-semibold text-foreground text-lg">Прогресс за сегодня</h3>
                <p className="text-muted-foreground text-sm mt-1">{stats.todayCompleted} из {stats.todayTotal} задач выполнено</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl"><TrendingUp className="w-6 h-6 text-primary" /></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-foreground">
                <span>Завершено</span><span>{stats.progress}%</span>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-primary rounded-full" />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-foreground">Просрочено</h3>
              <div className="p-2 bg-destructive/10 rounded-lg"><AlertCircle className="w-5 h-5 text-destructive" /></div>
            </div>
            <div className="mt-6"><span className="text-4xl font-bold text-foreground">{stats.overdueCount}</span><span className="text-muted-foreground text-sm ml-2">задач</span></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-foreground">Предстоящие</h3>
              <div className="p-2 bg-secondary rounded-lg"><CalendarIcon className="w-5 h-5 text-muted-foreground" /></div>
            </div>
            <div className="mt-6"><span className="text-4xl font-bold text-foreground">{stats.upcomingCount}</span><span className="text-muted-foreground text-sm ml-2">задач</span></div>
          </motion.div>
        </div>

        {upcomingTasks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <h3 className="text-lg font-semibold mb-4">Предстоящие задачи</h3>
            <div className="space-y-2">
              {upcomingTasks.map(task => (
                <UpcomingTaskRow
                  key={task.id}
                  task={task}
                  selected={selectedTaskId === task.id}
                  onClick={() => setSelectedTaskId(prev => prev === task.id ? null : task.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedTaskId && (
          <TaskDetail key="task-detail" taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function UpcomingTaskRow({ task, selected, onClick }: { task: Task; selected: boolean; onClick: () => void; key?: string }) {
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-sm cursor-pointer transition-all hover:border-muted-foreground/30',
        selected && 'ring-2 ring-primary/20 border-primary/30'
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        {task.due_date && (
          <p className={cn('text-xs mt-1 flex items-center gap-1', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
            <CalendarIcon className="w-3 h-3" />
            {format(new Date(task.due_date), 'eee, d MMM', { locale: ru })}
          </p>
        )}
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </div>
  );
}