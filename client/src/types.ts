/**
 * Модель данных по разделу 7 ТЗ_Кейс_2.
 *
 * Даты хранятся строкой в формате ISO: YYYY-MM-DD (локальная дата устройства).
 * Дни недели — ISO: 1 = понедельник … 7 = воскресенье.
 */

/** День недели ISO (1 = Пн … 7 = Вс). */
export type WeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Периодичность привычки (ТЗ 3.2). */
export type Periodicity = 'daily' | 'weekly';

/** Статус активности привычки (ТЗ 3.2: пауза / возобновление). */
export type HabitStatus = 'active' | 'paused';

/** Дата в формате YYYY-MM-DD. */
export type IsoDate = string;

/** Пользователь (ТЗ 7). В локальном режиме ID фиктивный «local». */
export interface User {
  id: string;
  /** Присутствует только после серверной проверки Telegram авторизации (ТЗ 8). */
  telegramId?: number;
  createdAt: string;
}

/** Привычка (ТЗ 7). */
export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string;
  /** Тип периодичности: ежедневно или выбранные дни недели. */
  periodicity: Periodicity;
  /** Используется при periodicity = 'weekly'. */
  weekdays: WeekDay[];
  /** Дата начала: привычки не запланированы до этой даты. */
  startDate: IsoDate;
  status: HabitStatus;
  createdAt: string;
}

/**
 * Отметка выполнения привычки (ТЗ 7).
 * Хранится отдельно от привычки, чтобы формировать отчёты за прошлые даты.
 */
export interface HabitCheckIn {
  id: string;
  habitId: string;
  /** Дата, за которую сделана отметка. */
  date: IsoDate;
  /** Признак выполнения: false — отменённая (ошибочная) отметка. */
  completed: boolean;
}

/** Статус задачи (ТЗ 3.3). */
export type TaskStatus = 'todo' | 'done';

/** Задача (ТЗ 7). */
export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  /** Срок выполнения; null — срок не задан. */
  dueDate: IsoDate | null;
  status: TaskStatus;
  createdAt: string;
  /** Дата завершения; null — задача не завершена. */
  completedAt: IsoDate | null;
}

/** Полный набор данных хранилища. */
export interface AppData {
  habits: Habit[];
  checkIns: HabitCheckIn[];
  tasks: Task[];
}
