import { useCallback, useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { AppProvider, useApp } from './store/AppStore';
import { applyTelegramTheme, initTelegramWebApp } from './lib/telegram';
import {
  IconCheckCircle,
  IconGear,
  IconList,
  IconRepeat,
  IconSquareCheck,
} from './components/Icons';
import { TodayPage } from './pages/TodayPage';
import { HabitsPage } from './pages/HabitsPage';
import { TasksPage } from './pages/TasksPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

type TabId = 'today' | 'habits' | 'tasks' | 'reports' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  Icon: ComponentType<{ size?: number }>;
}

const TABS: Tab[] = [
  { id: 'today', label: 'Сегодня', Icon: IconCheckCircle },
  { id: 'habits', label: 'Привычки', Icon: IconRepeat },
  { id: 'tasks', label: 'Задачи', Icon: IconSquareCheck },
  { id: 'reports', label: 'Отчёты', Icon: IconList },
  { id: 'settings', label: 'Настройки', Icon: IconGear },
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
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`tabbar__item${tab === id ? ' tabbar__item--active' : ''}`}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => navigate(id)}
          >
            <span className="tabbar__icon" aria-hidden="true">
              <Icon size={22} />
            </span>
            <span className="tabbar__label">{label}</span>
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
