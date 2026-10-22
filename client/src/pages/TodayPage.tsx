import { useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { HabitForm } from '../components/HabitForm';
import { TaskForm } from '../components/TaskForm';
import { useApp } from '../store/AppStore';
import { today } from '../lib/dates';
import { isCompleted, isScheduledOn, calculateStreak } from '../lib/habits';
import { periodicityLabel } from '../lib/labels';
import { buildDailyReport } from '../lib/reports';
import { sortTasks } from '../lib/tasks';

/**
 * Экран «Сегодня» (ТЗ 3.1): текущая дата, привычки и задачи на сегодня,
 * счётчики, процент выполнения за день, кнопки добавления.
 * Данные берутся из сохранённого хранилища, обновление — без перезагрузки.
 */
export function TodayPage() {
  const app = useApp();
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  if (!app.data) {
    return (
      <section className="page">
        <h1 className="page__title">Сегодня</h1>
        <p className="text">Загрузка…</p>
      </section>
    );
  }

  const now = today();
  const report = buildDailyReport(app.data, now);
  const habits = app.data.habits.filter((h) => isScheduledOn(h, now));
  const tasks = sortTasks(app.data.tasks.filter((t) => t.dueDate === now));
  const overdueCount = app.data.tasks.filter(
    (t) => t.dueDate !== null && t.dueDate < now && t.status === 'todo',
  ).length;
  const doneTasksToday = app.data.tasks.filter((t) => t.completedAt === now).length;

  return (
    <section className="page">
      <h1 className="page__title">Сегодня</h1>
      <p className="page__subtitle">
        {new Date().toLocaleDateString('ru-RU', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </p>

      <div className="card summary">
        <h2 className="card__title">Сводка за день</h2>
        <div className="summary__grid">
          <div className="summary__item">
            <span className="summary__value">
              {report.completedHabits} / {report.plannedHabits}
            </span>
            <span className="summary__label">Привычки (выполнено / запланировано)</span>
          </div>
          <div className="summary__item">
            <span className="summary__value">{doneTasksToday}</span>
            <span className="summary__label">Задач выполнено сегодня</span>
          </div>
        </div>
        {report.overall !== null ? (
          <div className="summary__percent">
            <span className="summary__percent-value">{report.overall}%</span>
            <span className="summary__percent-label">Процент выполнения за день</span>
          </div>
        ) : (
          <p className="summary__empty">
            На сегодня нет запланированных действий — процент не рассчитывается.
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="card__title">
          Привычки на сегодня ({report.completedHabits}/{report.plannedHabits})
        </h2>
        {habits.length === 0 ? (
          <EmptyState
            title="Нет запланированных привычек"
            description="На сегодня по вашему расписанию ничего не запланировано."
          />
        ) : (
          <ul className="today-list">
            {habits.map((habit) => {
              const done = isCompleted(app.data!.checkIns, habit.id, now);
              return (
                <li key={habit.id} className="today-row">
                  <div className="today-row__info">
                    <span className="today-row__title">{habit.title}</span>
                    <span className="today-row__meta">
                      {periodicityLabel(habit)} · серия {calculateStreak(habit, app.data!.checkIns)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`btn btn--small${done ? ' habit__mark--done' : ' btn--ghost'}`}
                    aria-pressed={done}
                    onClick={() => app.toggleCheckIn(habit.id, now)}
                  >
                    {done ? '✓' : 'Отметить'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card">
        <h2 className="card__title">Задачи на сегодня ({tasks.length})</h2>
        {tasks.length === 0 ? (
          <EmptyState title="Задач на сегодня нет" description="Задачи со сроком «сегодня» отсутствуют." />
        ) : (
          <ul className="today-list">
            {tasks.map((task) => {
              const done = task.status === 'done';
              return (
                <li key={task.id} className="today-row">
                  <div className="today-row__info">
                    <span className={`today-row__title${done ? ' today-row__title--done' : ''}`}>
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="today-row__meta">{task.description}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`btn btn--small${done ? ' habit__mark--done' : ' btn--ghost'}`}
                    aria-pressed={done}
                    onClick={() => app.toggleTaskStatus(task.id)}
                  >
                    {done ? '✓' : 'Выполнить'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {overdueCount > 0 && (
          <p className="today__overdue">
            Просрочено задач: {overdueCount} — они отмечены на экране «Задачи».
          </p>
        )}
      </div>

      <div className="today__actions">
        <button type="button" className="btn" onClick={() => setShowHabitForm(true)}>
          + Привычка
        </button>
        <button type="button" className="btn" onClick={() => setShowTaskForm(true)}>
          + Задача
        </button>
      </div>

      {showHabitForm && (
        <HabitForm
          onSubmit={(input) => {
            app.createHabit(input);
            setShowHabitForm(false);
          }}
          onCancel={() => setShowHabitForm(false)}
        />
      )}
      {showTaskForm && (
        <TaskForm
          onSubmit={(input) => {
            app.createTask(input);
            setShowTaskForm(false);
          }}
          onCancel={() => setShowTaskForm(false)}
        />
      )}
    </section>
  );
}
