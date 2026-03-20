import React, { useState, useRef } from 'react';
import { useAppContext, Task, Step } from '../store';
import { Sun, Star, Calendar, CheckCircle2, Circle, Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface TaskDetailProps {
  taskId: string;
  onClose: () => void;
  key?: string;
}

export function TaskDetail({ taskId, onClose }: TaskDetailProps) {
  const { tasks, updateTask, deleteTask, addStep, updateStep, deleteStep } = useAppContext();
  const task = tasks.find(t => t.id === taskId);
  const [newStepTitle, setNewStepTitle] = useState('');

  if (!task) return null;

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;
    await addStep(task.id, newStepTitle.trim());
    setNewStepTitle('');
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-80 border-l border-border bg-card flex flex-col h-[calc(100vh-2rem)] sticky top-4 rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-lg">Task Details</h3>
        <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex items-start gap-3">
          <button
            onClick={() => updateTask(task.id, { is_completed: !task.is_completed })}
            className="mt-1 flex-shrink-0"
          >
            {task.is_completed
              ? <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
              : <Circle className="w-6 h-6 text-muted-foreground hover:text-foreground transition-colors" />
            }
          </button>
          <input
            type="text"
            value={task.title}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
            className={cn(
              'w-full bg-transparent border-none focus:ring-0 p-0 text-lg font-medium',
              task.is_completed && 'line-through text-muted-foreground'
            )}
          />
          <button
            onClick={() => updateTask(task.id, { is_important: !task.is_important })}
            className="mt-1 flex-shrink-0"
          >
            <Star className={cn('w-6 h-6 transition-colors', task.is_important ? 'fill-foreground text-foreground' : 'text-muted-foreground hover:text-foreground')} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            {task.steps.map(step => (
              <div key={step.id} className="flex items-center gap-2 group">
                <button onClick={() => updateStep(task.id, step.id, { is_completed: !step.is_completed })} className="flex-shrink-0">
                  {step.is_completed
                    ? <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    : <Circle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                  }
                </button>
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => updateStep(task.id, step.id, { title: e.target.value })}
                  className={cn(
                    'flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm',
                    step.is_completed && 'line-through text-muted-foreground'
                  )}
                />
                <button
                  onClick={() => deleteStep(task.id, step.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddStep} className="flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              placeholder="Add step"
              className="flex-1 bg-transparent border-none focus:ring-0 p-0 placeholder:text-muted-foreground"
            />
          </form>
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-2">
          <button
            onClick={() => updateTask(task.id, { is_my_day: !task.is_my_day })}
            className={cn(
              'flex items-center gap-3 w-full p-3 rounded-xl transition-colors text-sm font-medium',
              task.is_my_day ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50 text-muted-foreground'
            )}
          >
            <Sun className={cn('w-5 h-5', task.is_my_day && 'text-primary')} />
            {task.is_my_day ? 'Added to My Day' : 'Add to My Day'}
            {task.is_my_day && (
              <X
                className="w-4 h-4 ml-auto hover:bg-background rounded-sm"
                onClick={(e) => { e.stopPropagation(); updateTask(task.id, { is_my_day: false }); }}
              />
            )}
          </button>

          <button
            onClick={() => updateTask(task.id, { is_important: !task.is_important })}
            className={cn(
              'flex items-center gap-3 w-full p-3 rounded-xl transition-colors text-sm font-medium',
              task.is_important ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50 text-muted-foreground'
            )}
          >
            <Star className={cn('w-5 h-5', task.is_important ? 'fill-primary text-primary' : '')} />
            {task.is_important ? 'Marked as Important' : 'Mark as Important'}
            {task.is_important && (
              <X
                className="w-4 h-4 ml-auto hover:bg-background rounded-sm"
                onClick={(e) => { e.stopPropagation(); updateTask(task.id, { is_important: false }); }}
              />
            )}
          </button>
        </div>

        <DueDatePicker
          value={task.due_date}
          onChange={(date) => updateTask(task.id, { due_date: date })}
        />

        <div className="h-px bg-border" />

        <textarea
          value={task.note || ''}
          onChange={(e) => updateTask(task.id, { note: e.target.value })}
          placeholder="Add note"
          className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm resize-none min-h-[100px] placeholder:text-muted-foreground"
        />
      </div>

      <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-secondary/30">
        <span>Created {format(new Date(task.created_at), 'MMM d')}</span>
        <button
          onClick={() => { deleteTask(task.id); onClose(); }}
          className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function DueDatePicker({ value, onChange }: { value?: string; onChange: (date: string | undefined) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const toInputValue = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw) { onChange(undefined); return; }
    onChange(new Date(raw).toISOString());
  };

  return (
    <div className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary/50 transition-colors text-sm font-medium text-muted-foreground">
      <Calendar className="w-5 h-5 flex-shrink-0" />
      <span
        className={cn('flex-1 cursor-pointer', value && 'text-foreground')}
        onClick={() => inputRef.current?.showPicker()}
      >
        {value ? `Due ${format(new Date(value), 'EEE, MMM d')}` : 'Add due date'}
      </span>
      <input ref={inputRef} type="date" value={toInputValue(value)} onChange={handleChange} className="sr-only" />
      {value && (
        <button onClick={() => onChange(undefined)} className="p-1 hover:bg-background rounded-sm flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
