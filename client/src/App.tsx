import { useCallback, useEffect, useState } from 'react';
import { AppProvider, useApp } from './store/AppStore';
import { applyTelegramTheme, initTelegramWebApp } from './lib/telegram';
import { TodayPage } from './pages/TodayPage';
import { HabitsPage } from './pages/HabitsPage';
import { TasksPage } from './pages/TasksPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

type TabId = 'today' | 'habits' | 'tasks' | 'reports' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'today', label: 'Сегодня', icon: '✓' },
  { id: 'habits', label: 'Привычки', icon: '↻' },
  { id: 'tasks', label: 'Задачи', icon: '☐' },
  { id: 'reports', label: 'Отчёты', icon: '▤' },
  { id: 'settings', label: 'Настройки', icon: '⚙' },
];

function Shell() {
  const app = useApp();
  const [tab, setTab] = useState<TabId>('today');

  useEffect(() => {
    initTelegramWebApp();
    applyTelegramTheme();
  }, []);

  const navigate = useCallback((next: TabId) => {
    setTab(next);
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__title">Трекер привычек</span>
        <span
          className={`badge ${app.storageMode === 'wp' ? 'badge--success' : 'badge--mode'}`}
          title={app.storageLabel}
        >
          {app.storageMode === 'wp' ? 'WordPress' : 'Тестовый режим'}
        </span>
      </header>

      <main className="app__main">
        {app.error && (
          <div className="banner banner--error" role="alert">
            <span>{app.error}</span>
            <button
              type="button"
              className="banner__close"
              aria-label="Скрыть сообщение"
              onClick={app.saveErrorDismiss}
            >
              ×
            </button>
          </div>
        )}

        {app.loading ? (
          <p className="text">Загрузка…</p>
        ) : (
          <>
            {tab === 'today' && <TodayPage />}
            {tab === 'habits' && <HabitsPage />}
            {tab === 'tasks' && <TasksPage />}
            {tab === 'reports' && <ReportsPage />}
            {tab === 'settings' && <SettingsPage onHome={() => navigate('today')} />}
          </>
        )}
      </main>

      {app.toast && (
        <div className="toast" role="status">
          {app.toast}
        </div>
      )}

      <nav className="tabbar" aria-label="Основная навигация">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tabbar__item${tab === t.id ? ' tabbar__item--active' : ''}`}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => navigate(t.id)}
          >
            <span className="tabbar__icon" aria-hidden="true">
              {t.icon}
            </span>
            <span className="tabbar__label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
