import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppData, Habit, HabitCheckIn, IsoDate, Task } from '../types';
import { createStorage, emptyData, type StorageAdapter, type StorageMode } from '../storage/adapter';

/**
 * Хранилище состояния приложения: загрузка через StorageAdapter,
 * неизменяемые обновления и сохранение после каждого изменения.
 */

export interface HabitInput {
  title: string;
  description: string;
  periodicity: Habit['periodicity'];
  weekdays: Habit['weekdays'];
  startDate: IsoDate;
}

export interface TaskInput {
  title: string;
  description: string;
  dueDate: IsoDate | null;
}

interface AppContextValue {
  /** null, пока данные не загружены. */
  data: AppData | null;
  loading: boolean;
  /** Ошибка последнего сохранения/загрузки. */
  error: string | null;
  storageLabel: string;
  storageMode: StorageMode;
  toast: string | null;
  notify(message: string): void;
  saveErrorDismiss(): void;

  createHabit(input: HabitInput): void;
  updateHabit(id: string, input: HabitInput): void;
  deleteHabit(id: string): void;
  toggleHabitStatus(id: string): void;
  toggleCheckIn(habitId: string, date: IsoDate): void;

  createTask(input: TaskInput): void;
  updateTask(id: string, input: TaskInput): void;
  deleteTask(id: string): void;
  toggleTaskStatus(id: string): void;
}

const AppContext = createContext<AppContextValue | null>(null);

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const storageRef = useRef<StorageAdapter | null>(null);
  if (storageRef.current === null) storageRef.current = createStorage();
  const storage = storageRef.current;

  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    storage
      .load()
      .then((loaded) => {
        if (!cancelled) {
          setData(loaded);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(emptyData());
          setLoading(false);
          setError('Не удалось загрузить данные из хранилища');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [storage]);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  /** Применяет изменение и сохраняет его (ТЗ: без необоснованной потери данных). */
  const commit = useCallback(
    (mutate: (current: AppData) => AppData, failureMessage: string) => {
      setData((current) => {
        if (!current) return current;
        const next = mutate(current);
        storage.save(next).catch(() => setError(failureMessage));
        return next;
      });
    },
    [storage],
  );

  const value = useMemo<AppContextValue>(() => {
    return {
      data,
      loading,
      error,
      storageLabel: storage.label,
      storageMode: storage.mode,
      toast,
      notify,
      saveErrorDismiss: () => setError(null),

      createHabit: (input) => {
        const habit: Habit = {
          id: newId(),
          userId: 'local',
          ...input,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        commit((d) => ({ ...d, habits: [...d.habits, habit] }), 'Не удалось сохранить привычку');
        notify('Привычка создана');
      },

      updateHabit: (id, input) => {
        commit(
          (d) => ({
            ...d,
            habits: d.habits.map((h) => (h.id === id ? { ...h, ...input } : h)),
          }),
          'Не удалось сохранить изменения',
        );
        notify('Изменения сохранены');
      },

      deleteHabit: (id) => {
        commit(
          (d) => ({
            ...d,
            habits: d.habits.filter((h) => h.id !== id),
            // Отметки удаляемой привычки убираем вместе с ней.
            checkIns: d.checkIns.filter((c) => c.habitId !== id),
          }),
          'Не удалось удалить привычку',
        );
        notify('Привычка удалена');
      },

      toggleHabitStatus: (id) => {
        const habit = data?.habits.find((h) => h.id === id);
        const willPause = habit?.status === 'active';
        commit(
          (d) => ({
            ...d,
            habits: d.habits.map((h) =>
              h.id === id ? { ...h, status: h.status === 'active' ? 'paused' : 'active' } : h,
            ),
          }),
          'Не удалось изменить статус',
        );
        notify(willPause ? 'Привычка приостановлена' : 'Привычка возобновлена');
      },

      toggleCheckIn: (habitId, date) => {
        const existing = data?.checkIns.find((c) => c.habitId === habitId && c.date === date);
        const willComplete = existing ? !existing.completed : true;
        commit((d) => {
          const current = d.checkIns.find((c) => c.habitId === habitId && c.date === date);
          let checkIns: HabitCheckIn[];
          if (current) {
            const completed = !current.completed;
            checkIns = d.checkIns.map((c) => (c.id === current.id ? { ...c, completed } : c));
          } else {
            checkIns = [...d.checkIns, { id: newId(), habitId, date, completed: true }];
          }
          return { ...d, checkIns };
        }, 'Не удалось сохранить отметку');
        notify(willComplete ? 'Отметка добавлена' : 'Отметка отменена');
      },

      createTask: (input) => {
        const task: Task = {
          id: newId(),
          userId: 'local',
          ...input,
          status: 'todo',
          createdAt: new Date().toISOString(),
          completedAt: null,
        };
        commit((d) => ({ ...d, tasks: [...d.tasks, task] }), 'Не удалось сохранить задачу');
        notify('Задача создана');
      },

      updateTask: (id, input) => {
        commit(
          (d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...input } : t)) }),
          'Не удалось сохранить изменения',
        );
        notify('Изменения сохранены');
      },

      deleteTask: (id) => {
        commit(
          (d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }),
          'Не удалось удалить задачу',
        );
        notify('Задача удалена');
      },

      toggleTaskStatus: (id) => {
        const task = data?.tasks.find((t) => t.id === id);
        const willComplete = task?.status === 'todo';
        commit((d) => {
          const tasks = d.tasks.map((t): Task => {
            if (t.id !== id) return t;
            const done = t.status === 'todo';
            return {
              ...t,
              status: done ? 'done' : 'todo',
              completedAt: done ? new Date().toISOString().slice(0, 10) : null,
            };
          });
          return { ...d, tasks };
        }, 'Не удалось изменить статус задачи');
        notify(willComplete ? 'Задача выполнена' : 'Задача возвращена в работу');
      },
    };
  }, [data, loading, error, toast, notify, commit, storage]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp должен использоваться внутри AppProvider');
  return ctx;
}
