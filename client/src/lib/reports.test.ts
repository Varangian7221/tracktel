import { describe, expect, it } from 'vitest';
import type { AppData, Habit, HabitCheckIn, Task } from '../types';
import { buildDailyReport, buildSevenDayStats, percent } from './reports';

const TODAY = '2026-10-22'; // четверг

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    userId: 'local',
    title: 'Привычка',
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

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    userId: 'local',
    title: 'Задача',
    description: '',
    dueDate: null,
    status: 'todo',
    createdAt: '2026-10-01T09:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

function data(overrides: Partial<AppData> = {}): AppData {
  return { habits: [], checkIns: [], tasks: [], ...overrides };
}

describe('percent', () => {
  it('возвращает null при нулевом знаменателе', () => {
    expect(percent(0, 0)).toBeNull();
  });
  it('округляет до целого', () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(2, 3)).toBe(67);
  });
});

describe('buildDailyReport — пустые состояния (ТЗ 3.4)', () => {
  it('нет данных — нули и null-проценты, isEmpty', () => {
    const r = buildDailyReport(data(), TODAY);
    expect(r.plannedHabits).toBe(0);
    expect(r.completedHabits).toBe(0);
    expect(r.habitPercent).toBeNull();
    expect(r.taskPercent).toBeNull();
    expect(r.overall).toBeNull();
    expect(r.isEmpty).toBe(true);
  });

  it('привычка ещё не началась — не запланирована, процент не показывается', () => {
    const d = data({ habits: [habit({ startDate: '2026-11-01' })] });
    const r = buildDailyReport(d, TODAY);
    expect(r.plannedHabits).toBe(0);
    expect(r.habitPercent).toBeNull();
    expect(r.isEmpty).toBe(true);
  });

  it('недельная привычка, сегодня не выбранный день — не запланирована', () => {
    const d = data({ habits: [habit({ periodicity: 'weekly', weekdays: [1] })] });
    const r = buildDailyReport(d, TODAY); // четверг
    expect(r.plannedHabits).toBe(0);
    expect(r.isEmpty).toBe(true);
  });
});

describe('buildDailyReport — расчёт', () => {
  it('считает запланированные/выполненные привычки и задачи', () => {
    const d = data({
      habits: [habit({ id: 'h1' }), habit({ id: 'h2' })],
      checkIns: [checkIn('h1', TODAY)],
      tasks: [
        task({ id: 't1', dueDate: TODAY, status: 'done', completedAt: TODAY }),
        task({ id: 't2', dueDate: TODAY }),
        task({ id: 't3', dueDate: '2026-10-21', status: 'done', completedAt: '2026-10-21' }),
      ],
    });
    const r = buildDailyReport(d, TODAY);
    expect(r.plannedHabits).toBe(2);
    expect(r.completedHabits).toBe(1);
    expect(r.habitPercent).toBe(50);
    expect(r.plannedTasks).toBe(2); // со сроком на сегодня
    expect(r.completedOfPlannedTasks).toBe(1);
    expect(r.taskPercent).toBe(50);
    expect(r.completedTasks).toBe(1); // завершена сегодня (t3 завершена вчера)
    expect(r.overall).toBe(50);
    expect(r.isEmpty).toBe(false);
  });

  it('общий результат — среднее из доступных процентов', () => {
    const d = data({
      habits: [habit({ id: 'h1' }), habit({ id: 'h2' }), habit({ id: 'h3' })],
      checkIns: [checkIn('h1', TODAY), checkIn('h2', TODAY)], // 67%
      tasks: [task({ id: 't1', dueDate: TODAY, status: 'done', completedAt: TODAY })], // 100%
    });
    const r = buildDailyReport(d, TODAY);
    expect(r.habitPercent).toBe(67);
    expect(r.taskPercent).toBe(100);
    expect(r.overall).toBe(84); // round((67+100)/2)
  });

  it('отменённая отметка (completed=false) не считается выполнением', () => {
    const d = data({
      habits: [habit()],
      checkIns: [checkIn('h1', TODAY, false)],
    });
    const r = buildDailyReport(d, TODAY);
    expect(r.completedHabits).toBe(0);
    expect(r.habitPercent).toBe(0);
  });
});

describe('buildSevenDayStats (ТЗ 3.5)', () => {
  it('пустые данные — null процентов', () => {
    const s = buildSevenDayStats(data(), TODAY);
    expect(s.completedHabits).toBe(0);
    expect(s.completedTasks).toBe(0);
    expect(s.scheduledOccurrences).toBe(0);
    expect(s.habitPercent).toBeNull();
    expect(s.from).toBe('2026-10-16');
    expect(s.to).toBe(TODAY);
  });

  it('считает только записи внутри 7 дней', () => {
    const d = data({
      habits: [habit()],
      checkIns: [
        checkIn('h1', '2026-10-16'), // внутри
        checkIn('h1', '2026-10-15'), // 8 дней назад — вне
        checkIn('h1', '2026-10-14', false), // вне и отменена
      ],
      tasks: [
        task({ id: 't1', status: 'done', completedAt: '2026-10-18', dueDate: '2026-10-18' }),
        task({ id: 't2', status: 'done', completedAt: '2026-10-10', dueDate: '2026-10-10' }),
      ],
    });
    const s = buildSevenDayStats(d, TODAY);
    expect(s.completedHabits).toBe(1);
    expect(s.completedTasks).toBe(1);
  });

  it('процент по запланированным выполнениям привычек за период', () => {
    // Ежедневная привычка с 16.10: 7 запланирований, 2 выполнены.
    const d = data({
      habits: [habit({ startDate: '2026-10-16' })],
      checkIns: [checkIn('h1', '2026-10-16'), checkIn('h1', '2026-10-21')],
    });
    const s = buildSevenDayStats(d, TODAY);
    expect(s.scheduledOccurrences).toBe(7);
    expect(s.completedHabits).toBe(2);
    expect(s.habitPercent).toBe(29); // round(2/7)
  });

  it('недельная привычка учитывает только выбранные дни', () => {
    // Пн(19), Ср(21) входят в период 16–22.10 → 2 запланирования.
    const d = data({
      habits: [habit({ periodicity: 'weekly', weekdays: [1, 3], startDate: '2026-10-01' })],
      checkIns: [checkIn('h1', '2026-10-19')],
    });
    const s = buildSevenDayStats(d, TODAY);
    expect(s.scheduledOccurrences).toBe(2);
    expect(s.habitPercent).toBe(50);
  });
});
