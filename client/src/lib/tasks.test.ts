import { describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { isOverdueTask, sortTasks } from './tasks';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't',
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

describe('sortTasks (ТЗ 3.3)', () => {
  it('сортирует по сроку; без срока — в конце', () => {
    const tasks = [
      task({ id: 'noDue', dueDate: null }),
      task({ id: 'late', dueDate: '2026-10-30' }),
      task({ id: 'early', dueDate: '2026-10-10' }),
    ];
    expect(sortTasks(tasks).map((t) => t.id)).toEqual(['early', 'late', 'noDue']);
  });

  it('при одинаковом сроке сначала невыполненные', () => {
    const tasks = [
      task({ id: 'done', dueDate: '2026-10-20', status: 'done' }),
      task({ id: 'todo', dueDate: '2026-10-20' }),
    ];
    expect(sortTasks(tasks).map((t) => t.id)).toEqual(['todo', 'done']);
  });

  it('не мутирует исходный массив', () => {
    const tasks = [task({ id: 'b' }), task({ id: 'a' })];
    sortTasks(tasks);
    expect(tasks.map((t) => t.id)).toEqual(['b', 'a']);
  });
});

describe('isOverdueTask (ТЗ 3.3)', () => {
  const now = '2026-10-22';

  it('просрочена: срок в прошлом и не выполнена', () => {
    expect(isOverdueTask(task({ dueDate: '2026-10-21' }), now)).toBe(true);
  });

  it('выполненная задача не просрочена', () => {
    expect(isOverdueTask(task({ dueDate: '2026-10-21', status: 'done' }), now)).toBe(false);
  });

  it('срок сегодня или в будущем — не просрочена', () => {
    expect(isOverdueTask(task({ dueDate: '2026-10-22' }), now)).toBe(false);
    expect(isOverdueTask(task({ dueDate: '2026-10-23' }), now)).toBe(false);
  });

  it('без срока — не просрочена', () => {
    expect(isOverdueTask(task({ dueDate: null }), now)).toBe(false);
  });
});
