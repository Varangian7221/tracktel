import { useState } from 'react';
import type { Habit, IsoDate } from '../types';
import { EmptyState } from '../components/EmptyState';
import { HabitForm } from '../components/HabitForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useApp, type HabitInput } from '../store/AppStore';
import { formatRuDate, today } from '../lib/dates';
import { calculateStreak, isCompleted, isScheduledOn } from '../lib/habits';
import { periodicityLabel } from '../lib/labels';

type FormState = { mode: 'create' } | { mode: 'edit'; habit: Habit } | null;

/** Экран «Привычки» (ТЗ 3.2): список, формы, отметки за конкретную дату. */
export function HabitsPage() {
  const app = useApp();
  const [selectedDate, setSelectedDate] = useState<IsoDate>(today());
  const [form, setForm] = useState<FormState>(null);
  const [pendingDelete, setPendingDelete] = useState<Habit | null>(null);

  if (!app.data) {
    return (
      <section className="page">
        <h1 className="page__title">Привычки</h1>
        <p className="text">Загрузка…</p>
      </section>
    );
  }

  const { habits, checkIns } = app.data;

  const handleSubmit = (input: HabitInput) => {
    if (form?.mode === 'edit') app.updateHabit(form.habit.id, input);
    else app.createHabit(input);
    setForm(null);
  };

  const renderScheduleStatus = (habit: Habit) => {
    if (habit.status === 'paused') {
      return <span className="habit__note">На паузе — не запланировано</span>;
    }
    if (selectedDate < habit.startDate) {
      return (
        <span className="habit__note">Начнётся {formatRuDate(habit.startDate)}</span>
      );
    }
    if (!isScheduledOn(habit, selectedDate)) {
      return <span className="habit__note">Не запланировано на эту дату</span>;
    }
    const done = isCompleted(checkIns, habit.id, selectedDate);
    return (
      <button
        type="button"
        className={`btn btn--small ${done ? 'habit__mark habit__mark--done' : ''}`}
        aria-pressed={done}
        onClick={() => app.toggleCheckIn(habit.id, selectedDate)}
      >
        {done ? '✓ Выполнено' : 'Отметить выполнением'}
      </button>
    );
  };

  return (
    <section className="page">
      <div className="page__head">
        <h1 className="page__title">Привычки</h1>
        <button type="button" className="btn btn--small" onClick={() => setForm({ mode: 'create' })}>
          + Добавить
        </button>
      </div>

      <label className="field">
        <span className="field__label">Дата отметок</span>
        <input
          className="field__input"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        {selectedDate !== today() && (
          <span className="field__hint">Просмотр прошлой даты: {formatRuDate(selectedDate)}</span>
        )}
      </label>

      {habits.length === 0 ? (
        <EmptyState
          title="Список привычек пуст"
          description="Создайте привычку: название, периодичность и дата начала."
          action={
            <button type="button" className="btn" onClick={() => setForm({ mode: 'create' })}>
              Создать привычку
            </button>
          }
        />
      ) : (
        <ul className="list">
          {habits.map((habit) => {
            const streak = calculateStreak(habit, checkIns);
            return (
              <li key={habit.id} className="card habit">
                <div className="habit__head">
                  <span className="habit__title">{habit.title}</span>
                  {habit.status === 'paused' && <span className="badge">На паузе</span>}
                </div>
                {habit.description && <p className="habit__desc">{habit.description}</p>}
                <div className="habit__meta">
                  <span className="habit__meta-item">{periodicityLabel(habit)}</span>
                  <span className="habit__meta-item">Серия: {streak}</span>
                </div>
                <div className="habit__schedule">{renderScheduleStatus(habit)}</div>
                <div className="habit__actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => setForm({ mode: 'edit', habit })}
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => app.toggleHabitStatus(habit.id)}
                  >
                    {habit.status === 'active' ? 'На паузу' : 'Продолжить'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small habit__delete"
                    onClick={() => setPendingDelete(habit)}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {form && (
        <HabitForm
          initial={form.mode === 'edit' ? form.habit : undefined}
          onSubmit={handleSubmit}
          onCancel={() => setForm(null)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Удалить привычку?"
          message={`«${pendingDelete.title}» и вся её история отметок будут удалены. Действие нельзя отменить.`}
          onConfirm={() => {
            app.deleteHabit(pendingDelete.id);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </section>
  );
}
