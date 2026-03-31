import React, { useState, useMemo } from 'react';
import { useAppContext, Task } from '../store';
import { Sun, Star, Calendar, Home, Plus, Circle, CheckCircle2, List as ListIcon, GripVertical } from 'lucide-react';
import { TaskDetail } from './TaskDetail';
import { cn } from '../lib/utils';
import { format, isPast, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface TasksViewProps {
  filterType: string;
  searchQuery: string;
}

export function TasksView({ filterType, searchQuery }: TasksViewProps) {
  const { tasks, lists, addTask, updateTask } = useAppContext();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const currentList = lists.find(l => l.id === filterType);

  const viewInfo = useMemo(() => {
    switch (filterType) {
      case 'my-day': return { title: 'Мой день', icon: Sun, date: format(new Date(), 'EEEE, d MMMM', { locale: ru }) };
      case 'important': return { title: 'Важное', icon: Star };
      case 'planned': return { title: 'Запланировано', icon: Calendar };
      case 'tasks': return { title: 'Задачи', icon: Home };
      default: return { title: currentList?.title || 'Список', icon: ListIcon };
    }
  }, [filterType, currentList]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.note?.toLowerCase().includes(query) ||
        t.steps.some(s => s.title.toLowerCase().includes(query))
      );
    } else {
      switch (filterType) {
        case 'my-day': filtered = tasks.filter(t => t.is_my_day); break;
        case 'important': filtered = tasks.filter(t => t.is_important); break;
        case 'planned': filtered = tasks.filter(t => t.due_date); break;
        case 'tasks': filtered = tasks.filter(t => !t.list_id); break;
        default: filtered = tasks.filter(t => t.list_id === filterType); break;
      }
    }

    // Делаем копию массива перед сортировкой, чтобы React корректно видел изменения
    return [...filtered].sort((a, b) => {
      if (a.is_completed === b.is_completed) return b.order - a.order;
      return a.is_completed ? 1 : -1;
    });
  }, [tasks, filterType, searchQuery]);

  const uncompletedTasks = filteredTasks.filter(t => !t.is_completed);
  const completedTasks = filteredTasks.filter(t => t.is_completed);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const data: Partial<Task> = { title: newTaskTitle.trim() };
    if (filterType === 'my-day') data.is_my_day = true;
    else if (filterType === 'important') data.is_important = true;
    else if (filterType === 'planned') data.due_date = new Date().toISOString();
    else if (filterType !== 'tasks') data.list_id = filterType;

    addTask(data);
    setNewTaskTitle('');
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src === dst) return;

    const items: Task[] = Array.from(uncompletedTasks);
    const [moved] = items.splice(src, 1);
    items.splice(dst, 0, moved);

    let newOrder: number;
    if (dst === 0) {
      newOrder = (items[1]?.order ?? Date.now()) + 1000;
    } else if (dst === items.length - 1) {
      newOrder = (items[items.length - 2]?.order ?? Date.now()) - 1000;
    } else {
      newOrder = (items[dst - 1].order + items[dst + 1].order) / 2;
    }

    updateTask(moved.id, { order: newOrder });
  };

  const renderTask = (task: Task, index: number, isDraggable = false) => {
    const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
    const completedSteps = task.steps.filter(s => s.is_completed).length;
    const hasSteps = task.steps.length > 0;

    const content = (
      <div
        onClick={() => setSelectedTaskId(task.id)}
        className={cn(
          'group flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-sm cursor-pointer transition-all hover:border-muted-foreground/30',
          selectedTaskId === task.id && 'ring-2 ring-primary/20 border-primary/30'
        )}
      >
        {isDraggable && (
          <div className="drag-handle cursor-grab opacity-0 group-hover:opacity-100 text-muted-foreground mr-1 flex-shrink-0">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            updateTask(task.id, { is_completed: !task.is_completed }); 
          }} 
          className="flex-shrink-0"
        >
          {task.is_completed
            ? <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
            : <Circle className="w-6 h-6 text-muted-foreground hover:text-foreground transition-colors" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate transition-colors', task.is_completed && 'line-through text-muted-foreground')}>
            {task.title}
          </p>
          {(task.due_date || hasSteps || task.note || (task.list_id && filterType !== task.list_id)) && (
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {task.list_id && filterType !== task.list_id && (
                <span className="flex items-center gap-1">
                  <ListIcon className="w-3 h-3" />
                  {lists.find(l => l.id === task.list_id)?.title || 'Задачи'}
                </span>
              )}
              {hasSteps && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />{completedSteps} из {task.steps.length}
                </span>
              )}
              {task.due_date && (
                <span className={cn('flex items-center gap-1', isOverdue && !task.is_completed && 'text-destructive')}>
                  <Calendar className="w-3 h-3" />
                  {isOverdue && !task.is_completed ? 'Просрочено, ' : ''}
                  {format(new Date(task.due_date), 'eee, d MMM', { locale: ru })}
                </span>
              )}
              {task.note && (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-current rounded-sm opacity-70" /> Заметка
                </span>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            updateTask(task.id, { is_important: !task.is_important }); 
          }} 
          className="flex-shrink-0 p-2"
        >
          <Star className={cn('w-5 h-5 transition-colors', task.is_important ? 'fill-foreground text-foreground' : 'text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100')} />
        </button>
      </div>
    );

    if (isDraggable) {
      return (
        // @ts-expect-error - React 19 type compatibility
        <Draggable key={task.id} draggableId={task.id} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.8 : 1 }}
              className="mb-2"
            >
              {content}
            </div>
          )}
        </Draggable>
      );
    }

    return (
      <motion.div 
        layout 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95 }} 
        key={task.id} 
        className="mb-2"
      >
        {content}
      </motion.div>
    );
  };

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        <header className="mb-8">
          <div className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <viewInfo.icon className="w-8 h-8" />
            <h1>{viewInfo.title}</h1>
          </div>
          {viewInfo.date && <p className="text-muted-foreground mt-2">{viewInfo.date}</p>}
        </header>

        <form onSubmit={handleAddTask} className="mb-8">
          <div className="relative flex items-center bg-card border border-border rounded-xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
            <div className="pl-4 pr-2 text-muted-foreground"><Plus className="w-5 h-5" /></div>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Добавить задачу"
              className="flex-1 bg-transparent border-none focus:ring-0 py-4 text-sm font-medium placeholder:text-muted-foreground"
            />
          </div>
        </form>

        <div className="flex-1 overflow-y-auto pb-20">
          {!searchQuery ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="uncompleted-tasks">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="min-h-[10px]">
                    {uncompletedTasks.map((task, index) => renderTask(task, index, true))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="min-h-[10px]">
              <AnimatePresence mode="popLayout">
                {uncompletedTasks.map((task, index) => renderTask(task, index, false))}
              </AnimatePresence>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="pt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">
                Завершенные ({completedTasks.length})
              </h3>
              <AnimatePresence mode="popLayout">
                {completedTasks.map((task, index) => renderTask(task, index, false))}
              </AnimatePresence>
            </div>
          )}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <viewInfo.icon className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Задач пока нет</p>
              <p className="text-sm">Добавьте задачу, чтобы начать.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedTaskId && (
          <TaskDetail key="task-detail" taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}