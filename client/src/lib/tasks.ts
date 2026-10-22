import type { IsoDate, Task } from '../types';

/**
 * Логика задач (ТЗ 3.3):
 *  - сортировка по сроку выполнения;
 *  - просроченные невыполненные задачи визуально выделяются.
 */

/** Срок не задан — считаем бесконечным (в конце списка). */
function dueKey(task: Task): IsoDate {
  return task.dueDate ?? '9999-12-31';
}

/** Сортировка: по сроку, без срока — в конце; внутри срока сначала невыполненные. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const byDue = dueKey(a) < dueKey(b) ? -1 : dueKey(a) > dueKey(b) ? 1 : 0;
    if (byDue !== 0) return byDue;
    if (a.status === b.status) return 0;
    return a.status === 'todo' ? -1 : 1;
  });
}

/** Просрочена ли задача: срок уже прошёл и задача не выполнена. */
export function isOverdueTask(task: Task, date: IsoDate): boolean {
  return task.dueDate !== null && task.status === 'todo' && task.dueDate < date;
}
