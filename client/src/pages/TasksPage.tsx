import { useState } from 'react';
import type { Task } from '../types';
import { EmptyState } from '../components/EmptyState';
import { TaskForm } from '../components/TaskForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useApp, type TaskInput } from '../store/AppStore';
import { formatRuDate, today } from '../lib/dates';
import { isOverdueTask, sortTasks } from '../lib/tasks';

type FormState = { mode: 'create' } | { mode: 'edit'; task: Task } | null;

/** Экран «Задачи» (ТЗ 3.3): список, формы, статусы, выделение просроченных. */
export function TasksPage() {
  const app = useApp();
  const [form, setForm] = useState<FormState>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  if (!app.data) {
    return (
      <section className="page">
        <h1 className="page__title">Задачи</h1>
        <p className="text">Загрузка…</p>
      </section>
    );
  }

  const now = today();
  const tasks = sortTasks(app.data.tasks);

  const handleSubmit = (input: TaskInput) => {
    if (form?.mode === 'edit') app.updateTask(form.task.id, input);
    else app.createTask(input);
    setForm(null);
  };

  return (
    <section className="page">
      <div className="page__head">
        <h1 className="page__title">Задачи</h1>
        <button type="button" className="btn btn--small" onClick={() => setForm({ mode: 'create' })}>
          + Добавить
        </button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="Список задач пуст"
          description="Создайте задачу и при желании укажите срок выполнения."
          action={
            <button type="button" className="btn" onClick={() => setForm({ mode: 'create' })}>
              Создать задачу
            </button>
          }
        />
      ) : (
        <ul className="list">
          {tasks.map((task) => {
            const done = task.status === 'done';
            const overdue = isOverdueTask(task, now);
            return (
              <li
                key={task.id}
                className={`card task${done ? ' task--done' : ''}${overdue ? ' task--overdue' : ''}`}
              >
                <div className="task__head">
                  <span className="task__title">{task.title}</span>
                  <span className={`badge${done ? ' badge--success' : overdue ? ' badge--danger' : ''}`}>
                    {done ? 'Выполнена' : overdue ? 'Просрочена' : 'К выполнению'}
                  </span>
                </div>
                {task.description && <p className="task__desc">{task.description}</p>}
                <div className="task__meta">
                  <span>Срок: {task.dueDate ? formatRuDate(task.dueDate) : 'без срока'}</span>
                  {done && task.completedAt && <span>Завершена: {formatRuDate(task.completedAt)}</span>}
                </div>
                <div className="habit__actions">
                  <button
                    type="button"
                    className={`btn btn--small${done ? ' btn--ghost' : ''}`}
                    onClick={() => app.toggleTaskStatus(task.id)}
                  >
                    {done ? 'Вернуть в работу' : 'Выполнена'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => setForm({ mode: 'edit', task })}
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small habit__delete"
                    onClick={() => setPendingDelete(task)}
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
        <TaskForm
          initial={form.mode === 'edit' ? form.task : undefined}
          onSubmit={handleSubmit}
          onCancel={() => setForm(null)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Удалить задачу?"
          message={`«${pendingDelete.title}» будет удалена без возможности восстановления.`}
          onConfirm={() => {
            app.deleteTask(pendingDelete.id);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </section>
  );
}
