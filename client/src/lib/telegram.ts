/**
 * Минимальная обёртка над Telegram Web Apps API.
 *
 * Токен бота здесь и в клиентском коде в целом НЕ используется (ТЗ 8):
 * клиент только читает тему/размеры и передаёт init данные серверу.
 */

interface TelegramWebApp {
  ready?: () => void;
  expand?: () => void;
  colorScheme?: 'light' | 'dark';
  /** Строка авторизации — передаётся ТОЛЬКО на сервер для проверки (ТЗ 8). */
  initData?: string;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

/** Возвращает объект WebApp, если приложение запущено внутри Telegram. */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

/** Инициализирует WebApp: сигнализирует готовность и растягивает вьюпорт. */
export function initTelegramWebApp(): void {
  const tg = getTelegramWebApp();
  if (!tg) return;
  try {
    tg.ready?.();
    tg.expand?.();
  } catch {
    /* Telegram окружение недоступно — приложение работает обычным веб-приложением */
  }
}

/**
 * Применяет цветовую тему: в Telegram — её colorScheme, вне Telegram —
 * системную тему браузера (ТЗ 5: по возможности адаптация к теме Telegram).
 */
export function applyTelegramTheme(): 'light' | 'dark' {
  const tg = getTelegramWebApp();
  const prefersLight =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches;
  const scheme: 'light' | 'dark' = tg?.colorScheme ?? (prefersLight ? 'light' : 'dark');
  document.documentElement.dataset.theme = scheme;
  try {
    tg?.setHeaderColor?.(scheme === 'dark' ? '#1c1c1e' : '#f2f2f7');
    tg?.setBackgroundColor?.(scheme === 'dark' ? '#1c1c1e' : '#f2f2f7');
  } catch {
    /* необязательные методы могут отсутствовать в старых версиях Telegram */
  }
  return scheme;
}
