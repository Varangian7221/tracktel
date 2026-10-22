import { useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { useApp } from '../store/AppStore';
import { formatRuDate, today } from '../lib/dates';
import { calculateStreak } from '../lib/habits';
import { periodicityLabel } from '../lib/labels';
import { buildDailyReport, buildSevenDayStats } from '../lib/reports';
import type { IsoDate } from '../types';

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="metric">
      <span className="metric__value">{value}</span>
      <span className="metric__label">{label}</span>
    </div>
  );
}

/**
 * Экран «Отчёты» (ТЗ 3.4–3.5):
 *  - дневной отчёт за выбранную дату из сохранённых данных;
 *  - статистика за последние 7 дней;
 *  - текущая серия каждой привычки.
 */
export function ReportsPage() {
  const app = useApp();
  const [date, setDate] = useState<IsoDate>(today());

  if (!app.data) {
    return (
      <section className="page">
        <h1 className="page__title">Отчёты</h1>
        <p className="text">Загрузка…</p>
      </section>
    );
  }

  const report = buildDailyReport(app.data, date);
  const stats = buildSevenDayStats(app.data, today());
  const habits = app.data.habits;

  return (
    <section className="page">
      <h1 className="page__title">Отчёты</h1>

      <div className="card">
        <h2 className="card__title">Дневной отчёт</h2>
        <label className="field">
          <span className="field__label">Дата отчёта</span>
          <input
            className="field__input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <p className="report__date">{formatRuDate(date)}</p>

        {report.isEmpty ? (
          <EmptyState
            title="На эту дату нет запланированных действий"
            description="Отчёт появится, когда на выбранную дату будут запланированы привычки или задачи со сроком."
          />
        ) : (
          <>
            <div className="metrics">
              <Metric
                label="Запланировано привычек"
                value={String(report.plannedHabits)}
              />
              <Metric
                label="Выполнено привычек"
                value={
                  report.habitPercent === null
                    ? `${report.completedHabits} (н/д)`
                    : `${report.completedHabits} (${report.habitPercent}%)`
                }
              />
              <Metric label="Задач со сроком на дату" value={String(report.plannedTasks)} />
              <Metric
                label="Завершено задач"
                value={
                  report.taskPercent === null
                    ? `${report.completedTasks} (н/д)`
                    : `${report.completedTasks} (${report.taskPercent}%)`
                }
              />
            </div>
            {report.overall !== null ? (
              <div className="summary__percent">
                <span className="summary__percent-value">{report.overall}%</span>
                <span className="summary__percent-label">Общий результат за день</span>
              </div>
            ) : (
              <p className="summary__empty">
                Нет запланированных действий с рассчитываемым процентом.
              </p>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2 className="card__title">
          Статистика за 7 дней
          <span className="card__title-sub">
            {formatRuDate(stats.from)} — {formatRuDate(stats.to)}
          </span>
        </h2>
        <div className="metrics">
          <Metric label="Выполнено привычек" value={String(stats.completedHabits)} />
          <Metric label="Завершено задач" value={String(stats.completedTasks)} />
          <Metric
            label="% выполнения привычек"
            value={stats.habitPercent === null ? 'н/д' : `${stats.habitPercent}%`}
          />
          <Metric
            label="Запланировано выполнений"
            value={String(stats.scheduledOccurrences)}
          />
        </div>
        {stats.habitPercent === null && (
          <p className="summary__empty">
            За период не было запланированных выполнений привычек — процент не рассчитывается.
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="card__title">Серии привычек</h2>
        {habits.length === 0 ? (
          <EmptyState title="Привычек пока нет" description="Серии появятся после создания привычек." />
        ) : (
          <ul className="today-list">
            {habits.map((habit) => (
              <li key={habit.id} className="today-row">
                <div className="today-row__info">
                  <span className="today-row__title">{habit.title}</span>
                  <span className="today-row__meta">{periodicityLabel(habit)}</span>
                </div>
                <span className="streak">{calculateStreak(habit, app.data!.checkIns)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
