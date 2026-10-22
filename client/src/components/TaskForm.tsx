import { useState, type FormEvent } from 'react';
import type { Task } from '../types';
import { today } from '../lib/dates';
import type { TaskInput } from '../store/AppStore';
import { Modal } from './Modal';

interface TaskFormProps {
  /** Редактируемая задача; undefined — создание. */
  initial?: Task;
  onSubmit(input: TaskInput): void;
  onCancel(): void;
}

/** Форма создания/редактирования задачи (ТЗ 3.3): название, описание, срок. */
export function TaskForm({ initial, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [showErrors, setShowErrors] = useState(false);

  const titleError = title.trim() === '' ? 'Укажите название задачи' : null;
  const dueDateError =
    dueDate !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? 'Некорректная дата срока' : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (titleError || dueDateError) {
      setShowErrors(true);
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate === '' ? null : dueDate,
    });
  };

  return (
    <Modal title={initial ? 'Редактирование задачи' : 'Новая задача'} onClose={onCancel}>
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
            placeholder="Например, оплатить интернет"
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

        <label className="field">
          <span className="field__label">Срок выполнения</span>
          <input
            className="field__input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <span className="field__hint">
            Пусто — без срока. Для «сегодня»: {today()}
          </span>
          {showErrors && dueDateError && <span className="field__error">{dueDateError}</span>}
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
