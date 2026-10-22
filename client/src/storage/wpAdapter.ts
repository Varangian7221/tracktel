import type { AppData } from '../types';
import { getTelegramWebApp } from '../lib/telegram';
import { sanitize, type StorageAdapter, type StorageMode } from './core';

/**
 * Хранение через WordPress REST API (плагин tracktel).
 *
 * Каждый запрос несёт заголовок X-Telegram-Init-Data — сервер сам проверяет
 * подпись и определяет пользователя (ТЗ 8). Клиент НЕ передаёт Telegram ID
 * отдельно и НЕ содержит токен бота.
 */
export class WpRestAdapter implements StorageAdapter {
  readonly mode: StorageMode = 'wp';
  readonly label = 'Сервер (WordPress)';

  constructor(private readonly baseUrl: string) {}

  private async request(path: string, init?: RequestInit): Promise<unknown> {
    const initData = getTelegramWebApp()?.initData ?? '';
    if (!initData) {
      throw new Error(
        'Нет данных авторизации Telegram: приложение открыто вне Telegram Mini App.',
      );
    }

    const url = `${this.baseUrl.replace(/\/$/, '')}/wp-json/tracktel/v1${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': initData,
        ...(init?.headers ?? {}),
      },
      credentials: 'omit',
    });

    if (!res.ok) {
      throw new Error(`Ошибка сервера TrackTel: HTTP ${res.status}`);
    }
    return res.json();
  }

  async load(): Promise<AppData> {
    const body = (await this.request('/data')) as { data?: unknown };
    return sanitize(body.data);
  }

  async save(data: AppData): Promise<void> {
    await this.request('/data', {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
  }
}
