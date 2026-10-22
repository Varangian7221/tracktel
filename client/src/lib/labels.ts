import type { Habit, WeekDay } from '../types';
import { WEEKDAY_LABELS } from './dates';

/** Человекочитаемое описание периодичности привычки. */
export function periodicityLabel(habit: Habit): string {
  if (habit.periodicity === 'daily') return 'Ежедневно';
  if (habit.weekdays.length === 0) return 'Дни не выбраны';
  return habit.weekdays.map((d) => WEEKDAY_LABELS[d as WeekDay]).join(', ');
}
