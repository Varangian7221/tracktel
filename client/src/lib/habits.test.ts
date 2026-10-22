import { describe, expect, it } from 'vitest';
import type { Habit, HabitCheckIn, WeekDay } from '../types';
import { calculateStreak, isCompleted, isScheduledOn, scheduledHabits } from './habits';

/** 2026-10-22 — четверг (ISO 4). */
const TODAY = '2026-10-22';

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    userId: 'local',
    title: 'Тестовая привычка',
    description: '',
    periodicity: 'daily',
    weekdays: [],
    startDate: '2026-10-01',
    status: 'active',
    createdAt: '2026-10-01T09:00:00.000Z',
    ...overrides,
  };
}

function checkIn(habitId: string, date: string, completed = true): HabitCheckIn {
  return { id: `${habitId}@${date}`, habitId, date, completed };
}

describe('isScheduledOn', () => {
  it('ежедневная привычка запланирована с даты начала включительно', () => {
    const h = habit({ startDate: '2026-10-20' });
    expect(isScheduledOn(h, '2026-10-19')).toBe(false);
    expect(isScheduledOn(h, '2026-10-20')).toBe(true);
    expect(isScheduledOn(h, TODAY)).toBe(true);
  });

  it('недельная привычка запланирована только в выбранные дни', () => {
    const h = habit({ periodicity: 'weekly', weekdays: [1, 3, 5] as WeekDay[] });
    expect(isScheduledOn(h, '2026-10-19')).toBe(true); // понедельник
    expect(isScheduledOn(h, '2026-10-21')).toBe(true); // среда
    expect(isScheduledOn(h, TODAY)).toBe(false); // четверг не выбран
  });

  it('недельная привычка без дней недели не запланирована никогда', () => {
    const h = habit({ periodicity: 'weekly', weekdays: [] });
    expect(isScheduledOn(h, TODAY)).toBe(false);
  });

  it('приостановленная привычка не запланирована', () => {
    const h = habit({ status: 'paused' });
    expect(isScheduledOn(h, TODAY)).toBe(false);
  });
});

describe('isCompleted', () => {
  it('отметка completed=false не считается выполнением', () => {
    const ins = [checkIn('h1', TODAY, false)];
    expect(isCompleted(ins, 'h1', TODAY)).toBe(false);
    expect(isCompleted([checkIn('h1', TODAY)], 'h1', TODAY)).toBe(true);
    expect(isCompleted([checkIn('h1', TODAY)], 'h1', '2026-10-21')).toBe(false);
  });
});

describe('scheduledHabits', () => {
  it('фильтрует по расписанию и статусу', () => {
    const active = habit({ id: 'a' });
    const paused = habit({ id: 'b', status: 'paused' });
    const notYet = habit({ id: 'c', startDate: '2026-11-01' });
    expect(scheduledHabits([active, paused, notYet], TODAY).map((h) => h.id)).toEqual(['a']);
  });
});

describe('calculateStreak', () => {
  it('три дня подряд, включая сегодня', () => {
    const h = habit({ startDate: '2026-10-01' });
    const ins = [checkIn('h1', '2026-10-20'), checkIn('h1', '2026-10-21'), checkIn('h1', TODAY)];
    expect(calculateStreak(h, ins, TODAY)).toBe(3);
  });

  it('пропуск запланированного дня в прошлом обнуляет серию', () => {
    const h = habit({ startDate: '2026-10-01' });
    const ins = [checkIn('h1', '2026-10-20'), checkIn('h1', TODAY)]; // 21.10 пропущен
    expect(calculateStreak(h, ins, TODAY)).toBe(1);
  });

  it('сегодня без отметки не обнуляет вчерашнюю серию', () => {
    const h = habit({ startDate: '2026-10-01' });
    const ins = [checkIn('h1', '2026-10-20'), checkIn('h1', '2026-10-21')];
    expect(calculateStreak(h, ins, TODAY)).toBe(2);
  });

  it('незапланированные дни не прерывают серию (недельная привычка)', () => {
    // Пн 19.10, Ср 21.10 выполнены; Пт 23.10 ещё не наступил.
    const h = habit({ periodicity: 'weekly', weekdays: [1, 3, 5] as WeekDay[], startDate: '2026-10-01' });
    const ins = [checkIn('h1', '2026-10-19'), checkIn('h1', '2026-10-21')];
    expect(calculateStreak(h, ins, TODAY)).toBe(2);
  });

  it('недельная привычка: пропуск выбранного дня обнуляет серию', () => {
    const h = habit({ periodicity: 'weekly', weekdays: [1, 3] as WeekDay[], startDate: '2026-10-01' });
    // Ср 21.10 выполнена, но Пн 19.10 пропущен → серия = 1.
    // Чт 22.10 (сегодня) — незапланированный день, на результат не влияет.
    const ins = [checkIn('h1', '2026-10-12'), checkIn('h1', '2026-10-21')];
    expect(calculateStreak(h, ins, TODAY)).toBe(1);
  });

  it('до даты начала серии нет', () => {
    const h = habit({ startDate: '2026-10-21' });
    const ins = [checkIn('h1', '2026-10-20')];
    expect(calculateStreak(h, ins, TODAY)).toBe(0);
  });

  it('у приостановленной привычки серия равна 0', () => {
    const h = habit({ status: 'paused' });
    const ins = [checkIn('h1', TODAY)];
    expect(calculateStreak(h, ins, TODAY)).toBe(0);
  });
});
