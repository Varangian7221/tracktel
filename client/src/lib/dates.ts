import type { IsoDate, WeekDay } from '../types';

/**
 * Работа с датами. Все даты — локальные (ISO YYYY-MM-DD),
 * день недели — ISO (1 = Пн … 7 = Вс).
 */

/** Преобразует Date в строку ISO без сдвига часового пояса. */
export function toIsoDate(d: Date): IsoDate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Текущая локальная дата. */
export function today(): IsoDate {
  return toIsoDate(new Date());
}

/** Разбирает ISO-строку в Date (полдень — защита от перехода DST). */
export function parseIso(date: IsoDate): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** Добавляет (или вычитает) дни к дате. */
export function addDays(date: IsoDate, days: number): IsoDate {
  const d = parseIso(date);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

/** ISO-день недели даты: 1 = Пн … 7 = Вс. */
export function isoWeekDay(date: IsoDate): WeekDay {
  const wd = parseIso(date).getDay();
  return (wd === 0 ? 7 : wd) as WeekDay;
}

/** Сравнение дат строкой ISO (лексикографическое совпадает с хронологическим). */
export function compareIso(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Все даты от from до to включительно. */
export function eachDate(from: IsoDate, to: IsoDate): IsoDate[] {
  const result: IsoDate[] = [];
  let cur = from;
  while (cur <= to) {
    result.push(cur);
    cur = addDays(cur, 1);
  }
  return result;
}

/** Последние 7 дней включая endDate (порядок: от старых к новым). */
export function last7Days(endDate: IsoDate = today()): IsoDate[] {
  return eachDate(addDays(endDate, -6), endDate);
}

/** Русское форматирование даты, например «22 октября 2026». */
export function formatRuDate(date: IsoDate): string {
  return parseIso(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Названия дней недели (Пн…Вс) для форм. */
export const WEEKDAY_LABELS: Record<WeekDay, string> = {
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
  7: 'Вс',
};
