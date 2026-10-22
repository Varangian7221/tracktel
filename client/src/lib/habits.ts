import type { Habit, HabitCheckIn, IsoDate } from '../types';
import { addDays, isoWeekDay, today } from './dates';

/**
 * Логика привычек: расписание, отметки, серии (ТЗ 3.2, 3.5).
 *
 * Правило расписания:
 *  - привычка запланирована с даты startDate (учитывая саму дату начала);
 *  - periodicity 'daily' — каждый день;
 *  - periodicity 'weekly' — только в выбранные дни недели;
 *  - приостановленная (paused) привычка не запланирована;
 *  - день, когда выполнение не запланировано, не считается невыполненным (ТЗ 3.2).
 */

/** Запланирована ли привычка на указанную дату. */
export function isScheduledOn(habit: Habit, date: IsoDate): boolean {
  if (habit.status !== 'active') return false;
  if (date < habit.startDate) return false;
  if (habit.periodicity === 'daily') return true;
  if (habit.weekdays.length === 0) return false;
  return habit.weekdays.includes(isoWeekDay(date));
}

/** Есть ли отметка «выполнено» за дату (completed=false — отменённая отметка). */
export function isCompleted(checkIns: HabitCheckIn[], habitId: string, date: IsoDate): boolean {
  return checkIns.some((c) => c.habitId === habitId && c.date === date && c.completed);
}

/** Привычки, запланированные на дату (в порядке из массива). */
export function scheduledHabits(habits: Habit[], date: IsoDate): Habit[] {
  return habits.filter((h) => isScheduledOn(h, date));
}

/**
 * Текущая серия последовательных выполнений (ТЗ 3.2, 3.5).
 *
 * Считаются подряд идущие запланированные дни с отметкой «выполнено»,
 * backwards от refDate (по умолчанию — сегодня):
 *  - сегодняшний день без отметки НЕ обнуляет серию (она ещё не закончена);
 *  - пропущенный запланированный день в прошлом обнуляет серию;
 *  - незапланированные дни не влияют;
 *  - дни до startDate и приостановленные периоды не учитываются.
 */
export function calculateStreak(
  habit: Habit,
  checkIns: HabitCheckIn[],
  refDate: IsoDate = today(),
): number {
  if (habit.status !== 'active') return 0;

  let streak = 0;
  let date = refDate;

  // Ограничение: от даты начала до refDate.
  while (date >= habit.startDate) {
    if (isScheduledOn(habit, date)) {
      if (isCompleted(checkIns, habit.id, date)) {
        streak += 1;
      } else if (date < refDate) {
        // Пропущенный запланированный день в прошлом — серия прервана.
        break;
      }
      // refDate без отметки — серия не прерывается, просто не увеличивается.
    }
    date = addDays(date, -1);
  }
  return streak;
}
