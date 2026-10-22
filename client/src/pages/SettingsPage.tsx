import { useApp } from '../store/AppStore';

interface SettingsPageProps {
  /** Переход на главный экран (ТЗ 4). */
  onHome(): void;
}

/** Экран «Настройки» (ТЗ 4: информация о приложении и переход на главный экран). */
export function SettingsPage({ onHome }: SettingsPageProps) {
  const app = useApp();

  return (
    <section className="page">
      <h1 className="page__title">Настройки</h1>

      <div className="card">
        <h2 className="card__title">О приложении</h2>
        <p className="text">
          Учебный MVP трекера привычек и задач для Telegram Mini App. Разработано по ТЗ
          Кейс №2: React + TypeScript + Vite, Telegram Web Apps API, WordPress REST API.
        </p>
      </div>

      <div className="card">
        <h2 className="card__title">Режим хранения данных</h2>
        {app.storageMode === 'wp' ? (
          <p className="text">
            <strong>Серверный режим:</strong> данные сохраняются в базе данных WordPress
            и привязаны к вашей учётной записи Telegram (проверяется на сервере).
          </p>
        ) : (
          <p className="text">
            <strong>Тестовый режим:</strong> данные сохраняются локально в этом браузере
            (localStorage) и не синхронизируются с сервером. Это локальный прототип, а не
            многопользовательское приложение.
          </p>
        )}
        <p className="text">Активное хранилище: {app.storageLabel}.</p>
      </div>

      <div className="card">
        <h2 className="card__title">Разделы</h2>
        <button type="button" className="btn btn--block" onClick={onHome}>
          На главный экран
        </button>
      </div>
    </section>
  );
}
