import React, { useState } from 'react';
import { AppProvider, useAppContext } from './store';
import { Layout } from './components/Layout';
import { TasksView } from './components/TasksView';
import { DashboardView } from './components/DashboardView';
import { RoadmapView } from './components/roadmap/RoadmapView';
import { useAuth, AuthUser } from './lib/useAuth';

function Inner({ user }: { user: AuthUser }) {
  const { loading } = useAppContext();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) return null;

  return (
    <Layout
      initialTheme={user.theme}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      {activeTab === 'dashboard'
        ? <DashboardView />
        : activeTab === 'roadmap'
          ? <RoadmapView />
          : <TasksView filterType={activeTab} searchQuery={searchQuery} />
      }
    </Layout>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading || !user) return null;

  return (
    <AppProvider>
      <Inner user={user} />
    </AppProvider>
  );
}
