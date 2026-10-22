import type { AppData, Habit, IsoDate } from '../types';
import { eachDate, last7Days, today } from './dates';
import { isCompleted, isScheduledOn } from './habits';

/**
 * Дневной отчёт (ТЗ 3.4) и статистика за 7 дней (ТЗ 3.5).
 *
 * Всё считается ТОЛЬКО из сохранённых данных (checkIns, completedAt),
 * а не из текущего состояния интерфейса.
 *
 * Процент = null означает «показать пустое состояние вместо процента» (ТЗ 3.4).
 */

export interface DailyReport {
  date: IsoDate;
  /** Запланированные на дату привычки (только с даты начала, активные). */
  plannedHabits: number;
  /** Из запланированных — с отметкой «выполнено». */
  completedHabits: number;
  /** % выполнения привычек или null, если нечего планировать. */
  habitPercent: number | null;
  /** Задачи, завершённые в эту дату (completedAt = date). */
  completedTasks: number;
  /** Задачи со сроком на эту дату. */
  plannedTasks: number;
  /** Из задач со сроком на эту дату — выполненные. */
  completedOfPlannedTasks: number;
  /** % выполнения задач или null, если задач со сроком нет. */
  taskPercent: number | null;
  /** Общий результат за день (среднее из доступных процентов) или null. */
  overall: number | null;
  /** Нет ни запланированных привычек, ни задач со сроком. */
  isEmpty: boolean;
}

export interface SevenDayStats {
  from: IsoDate;
  to: IsoDate;
  /** Всего выполненных отметок привычек за 7 дней. */
  completedHabits: number;
  /** Всего завершённых задач за 7 дней. */
  completedTasks: number;
  /** Запланированных выполнений привычек за 7 дней. */
  scheduledOccurrences: number;
  /** % выполнения привычек за период или null, если нечего планировать. */
  habitPercent: number | null;
}

/** Процент; null при нулевом знаменателе. Округление до целого. */
export function percent(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 100);
}

/** Дневной отчёт по сохранённым данным. */
export function buildDailyReport(data: AppData, date: IsoDate): DailyReport {
  const scheduled = data.habits.filter((h) => isScheduledOn(h, date));
  const completedHabits = scheduled.filter((h) => isCompleted(data.checkIns, h.id, date)).length;

  const plannedTasks = data.tasks.filter((t) => t.dueDate === date);
  const completedOfPlannedTasks = plannedTasks.filter((t) => t.status === 'done').length;
  const completedTasks = data.tasks.filter((t) => t.completedAt === date).length;

  const habitPercent = percent(completedHabits, scheduled.length);
  const taskPercent = percent(completedOfPlannedTasks, plannedTasks.length);

  const available = [habitPercent, taskPercent].filter((p): p is number => p !== null);
  const overall =
    available.length > 0
      ? Math.round(available.reduce((sum, p) => sum + p, 0) / available.length)
      : null;

  return {
    date,
    plannedHabits: scheduled.length,
    completedHabits,
    habitPercent,
    completedTasks,
    plannedTasks: plannedTasks.length,
    completedOfPlannedTasks,
    taskPercent,
    overall,
    isEmpty: scheduled.length === 0 && plannedTasks.length === 0,
  };
}

/** Количество запланированных выполнений привычки в периоде [from, to]. */
function countScheduled(habit: Habit, from: IsoDate, to: IsoDate): number {
  let count = 0;
  for (const date of eachDate(from, to)) {
    if (isScheduledOn(habit, date)) count += 1;
  }
  return count;
}

/** Статистика за последние 7 дней (включая endDate). */
export function buildSevenDayStats(data: AppData, endDate: IsoDate = today()): SevenDayStats {
  const days = last7Days(endDate);
  const from = days[0];
  const to = days[days.length - 1];
  const inRange = (d: IsoDate | null): d is IsoDate => d !== null && d >= from && d <= to;

  const completedHabits = data.checkIns.filter((c) => c.completed && inRange(c.date)).length;
  const completedTasks = data.tasks.filter((t) => inRange(t.completedAt)).length;

  const activeHabits = data.habits.filter((h) => h.startDate <= to);
  const scheduledOccurrences = activeHabits.reduce(
    (sum, h) => sum + countScheduled(h, from, to),
    0,
  );

  return {
    from,
    to,
    completedHabits,
    completedTasks,
    scheduledOccurrences,
    habitPercent: percent(completedHabits, scheduledOccurrences),
  };
}

/** Задачи на указанную дату, отсортированные по сроку (ТЗ 3.3). */
export function tasksForDate(data: AppData, date: IsoDate) {
  return data.tasks
    .filter((t) => t.dueDate === date)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0));
}
