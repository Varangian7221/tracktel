import type { AppData } from '../types';
import { emptyData, sanitize, type StorageAdapter, type StorageMode } from './core';
import { WpRestAdapter } from './wpAdapter';

export { emptyData, sanitize };
export type { StorageAdapter, StorageMode };

const KEY = 'tracktel.data.v1';

/**
 * Хранение в localStorage браузера.
 * Ограничение: данные не покидают устройство; это НЕ многопользовательское
 * хранение (ТЗ 6 — явно указывается в интерфейсе и README).
 */
export class LocalStorageAdapter implements StorageAdapter {
  readonly mode: StorageMode = 'local';
  readonly label = 'Тестовый режим (локально)';

  async load(): Promise<AppData> {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return emptyData();
      return sanitize(JSON.parse(raw));
    } catch {
      // Повреждённый JSON или недоступный storage — не теряем приложение,
      // но и не подменяем данные молча: возвращаем пустое хранилище.
      return emptyData();
    }
  }

  async save(data: AppData): Promise<void> {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  }
}

/**
 * Фабрика хранилища.
 * Режим задаётся переменной окружения VITE_DATA_BACKEND:
 *  - 'local' (по умолчанию) — локальный прототип;
 *  - 'wp' — WordPress REST API (нужны VITE_WP_URL и запущенный плагин TrackTel).
 */
export function createStorage(): StorageAdapter {
  const backend = import.meta.env.VITE_DATA_BACKEND;
  const wpUrl = import.meta.env.VITE_WP_URL;
  if (backend === 'wp' && wpUrl) {
    return new WpRestAdapter(wpUrl);
  }
  return new LocalStorageAdapter();
}
