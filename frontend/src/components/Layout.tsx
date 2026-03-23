import React, { useState, useEffect, useRef } from 'react';
import { Sun, Star, Calendar, Home, Moon, Menu, X, Plus, List as ListIcon, Trash2, CheckCircle2, Search, Edit2, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../store';
import { api } from '../lib/api';

interface LayoutProps {
  children: React.ReactNode;
  initialTheme: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'my-day', label: 'Мой день', icon: Sun },
  { id: 'important', label: 'Важное', icon: Star },
  { id: 'planned', label: 'Запланировано', icon: Calendar },
  { id: 'tasks', label: 'Задачи', icon: Home },
];

export function Layout({ children, initialTheme, activeTab, setActiveTab, searchQuery, setSearchQuery }: LayoutProps) {
  const { lists, addList, deleteList, updateList } = useAppContext();
  const [isDark, setIsDark] = useState(() => {
    const dark = initialTheme === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    return dark;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    api.updateMe({ theme: next ? 'dark' : 'light' });
  };

  useEffect(() => {
    if (editingListId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingListId]);

  const handleAddList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    addList(newListTitle.trim());
    setNewListTitle('');
    setIsAddingList(false);
  };

  const handleUpdateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingListId && editingListTitle.trim()) {
      updateList(editingListId, editingListTitle.trim());
    }
    setEditingListId(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <CheckCircle2 className="w-6 h-6" />
          FocusFlow
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => toggleTheme()} className="p-2 rounded-full hover:bg-secondary transition-colors">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-full hover:bg-secondary transition-colors">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-b border-border bg-card"
          >
            <div className="p-4 pb-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск задач..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-secondary border-none focus:ring-2 focus:ring-primary/20 rounded-xl pl-9 pr-4 py-2 text-sm"
                />
              </div>
            </div>
            <nav className="flex flex-col p-4 gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left",
                    activeTab === item.id 
                      ? "bg-primary text-primary-foreground font-medium" 
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-border my-2" />
              {lists.map(list => (
                <button
                  key={list.id}
                  onClick={() => {
                    setActiveTab(list.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left",
                    activeTab === list.id 
                      ? "bg-primary text-primary-foreground font-medium" 
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ListIcon className="w-5 h-5" />
                  {list.title}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-4 h-screen sticky top-0">
        <div className="flex items-center gap-3 font-semibold text-xl mb-6 px-4 mt-2">
          <CheckCircle2 className="w-7 h-7" />
          FocusFlow
        </div>
        
        <div className="px-2 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск задач..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary border-none focus:ring-2 focus:ring-primary/20 rounded-xl pl-9 pr-4 py-2 text-sm transition-all"
            />
          </div>
        </div>
        
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left text-sm font-medium",
                activeTab === item.id 
                  ? "bg-secondary text-foreground shadow-sm" 
                  : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}

          <div className="h-px bg-border my-4 mx-4" />

          {lists.map(list => (
            <div key={list.id} className="group relative flex items-center">
              {editingListId === list.id ? (
                <form onSubmit={handleUpdateList} className="flex-1 px-2 py-1">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingListTitle}
                    onChange={(e) => setEditingListTitle(e.target.value)}
                    onBlur={handleUpdateList}
                    className="w-full bg-background border border-border focus:ring-2 focus:ring-primary/20 rounded-lg px-2 py-1.5 text-sm font-medium"
                  />
                </form>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab(list.id)}
                    className={cn(
                      "flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left text-sm font-medium",
                      activeTab === list.id 
                        ? "bg-secondary text-foreground shadow-sm" 
                        : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <ListIcon className="w-5 h-5" />
                    <span className="truncate pr-12">{list.title}</span>
                  </button>
                  <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingListId(list.id);
                        setEditingListTitle(list.title);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteList(list.id);
                        if (activeTab === list.id) setActiveTab('tasks');
                      }}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {isAddingList ? (
            <form onSubmit={handleAddList} className="px-4 py-2 mt-2">
              <input
                autoFocus
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onBlur={() => {
                  if (!newListTitle.trim()) setIsAddingList(false);
                }}
                placeholder="Название списка"
                className="w-full bg-secondary border-none focus:ring-2 focus:ring-primary/20 rounded-lg px-3 py-2 text-sm"
              />
            </form>
          ) : (
            <button
              onClick={() => setIsAddingList(true)}
              className="flex items-center gap-3 px-4 py-2.5 mt-2 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all duration-200 text-left text-sm font-medium"
            >
              <Plus className="w-5 h-5" />
              Новый список
            </button>
          )}
        </nav>

        <div className="mt-auto pt-4 border-t border-border">
          <button 
            onClick={() => toggleTheme()} 
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors w-full text-left text-sm font-medium"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDark ? 'Светлая тема' : 'Темная тема'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}