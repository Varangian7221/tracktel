import { useState, type FormEvent } from 'react';
import type { Habit, Periodicity, WeekDay } from '../types';
import { WEEKDAY_LABELS, today } from '../lib/dates';
import type { HabitInput } from '../store/AppStore';
import { Modal } from './Modal';

const ALL_WEEKDAYS: WeekDay[] = [1, 2, 3, 4, 5, 6, 7];

interface HabitFormProps {
  /** Редактируемая привычка; undefined — создание. */
  initial?: Habit;
  onSubmit(input: HabitInput): void;
  onCancel(): void;
}

/**
 * Форма создания/редактирования привычки (ТЗ 3.2):
 * название, описание, периодичность (ежедневно / дни недели), дата начала.
 */
export function HabitForm({ initial, onSubmit, onCancel }: HabitFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [periodicity, setPeriodicity] = useState<Periodicity>(initial?.periodicity ?? 'daily');
  const [weekdays, setWeekdays] = useState<WeekDay[]>(initial?.weekdays ?? []);
  const [startDate, setStartDate] = useState(initial?.startDate ?? today());
  const [showErrors, setShowErrors] = useState(false);

  const titleError = title.trim() === '' ? 'Укажите название привычки' : null;
  const weekdaysError =
    periodicity === 'weekly' && weekdays.length === 0
      ? 'Выберите хотя бы один день недели'
      : null;
  const startDateError = /^\d{4}-\d{2}-\d{2}$/.test(startDate)
    ? null
    : 'Укажите дату начала';

  const toggleWeekday = (day: WeekDay) => {
    setWeekdays((cur) =>
      cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day].sort((a, b) => a - b),
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (titleError || weekdaysError || startDateError) {
      setShowErrors(true);
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      periodicity,
      weekdays: periodicity === 'weekly' ? weekdays : [],
      startDate,
    });
  };

  return (
    <Modal title={initial ? 'Редактирование привычки' : 'Новая привычка'} onClose={onCancel}>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field__label">
            Название <span className="field__required">*</span>
          </span>
          <input
            className="field__input"
            type="text"
            value={title}
            maxLength={100}
            placeholder="Например, пить воду"
            onChange={(e) => setTitle(e.target.value)}
          />
          {showErrors && titleError && <span className="field__error">{titleError}</span>}
        </label>

        <label className="field">
          <span className="field__label">Описание</span>
          <textarea
            className="field__input field__input--textarea"
            value={description}
            maxLength={500}
            placeholder="Необязательно"
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <fieldset className="field">
          <legend className="field__label">Периодичность</legend>
          <div className="segmented">
            <label className="segmented__option">
              <input
                type="radio"
                name="periodicity"
                value="daily"
                checked={periodicity === 'daily'}
                onChange={() => setPeriodicity('daily')}
              />
              <span>Ежедневно</span>
            </label>
            <label className="segmented__option">
              <input
                type="radio"
                name="periodicity"
                value="weekly"
                checked={periodicity === 'weekly'}
                onChange={() => setPeriodicity('weekly')}
              />
              <span>Дни недели</span>
            </label>
          </div>
        </fieldset>

        {periodicity === 'weekly' && (
          <fieldset className="field">
            <legend className="field__label">Выберите дни</legend>
            <div className="weekdays">
              {ALL_WEEKDAYS.map((day) => (
                <label
                  key={day}
                  className={`weekdays__day${weekdays.includes(day) ? ' weekdays__day--active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={weekdays.includes(day)}
                    onChange={() => toggleWeekday(day)}
                  />
                  <span>{WEEKDAY_LABELS[day]}</span>
                </label>
              ))}
            </div>
            {showErrors && weekdaysError && <span className="field__error">{weekdaysError}</span>}
          </fieldset>
        )}

        <label className="field">
          <span className="field__label">
            Дата начала <span className="field__required">*</span>
          </span>
          <input
            className="field__input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          {showErrors && startDateError && <span className="field__error">{startDateError}</span>}
        </label>

        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Отмена
          </button>
          <button type="submit" className="btn">
            {initial ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
