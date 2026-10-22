import type { AppData } from '../types';

/**
 * Общие типы и helpers слоя хранения.
 * Вынесены отдельно, чтобы реализации (localStorage, WordPress) не зависели
 * друг от друга.
 */

export type StorageMode = 'local' | 'wp';

export interface StorageAdapter {
  readonly mode: StorageMode;
  /** Человекочитаемое название режима для интерфейса. */
  readonly label: string;
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
}

export function emptyData(): AppData {
  return { habits: [], checkIns: [], tasks: [] };
}

/** Валидация распарсенных данных: при повреждении возвращаем пустой набор. */
export function sanitize(parsed: unknown): AppData {
  if (typeof parsed !== 'object' || parsed === null) return emptyData();
  const p = parsed as Partial<AppData>;
  const habits = Array.isArray(p.habits) ? p.habits : [];
  const checkIns = Array.isArray(p.checkIns) ? p.checkIns : [];
  const tasks = Array.isArray(p.tasks) ? p.tasks : [];
  return { habits, checkIns, tasks };
}
