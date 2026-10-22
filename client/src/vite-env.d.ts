/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Какой бэкенд хранения использовать: local (тестовый) или wp (сервер). */
  readonly VITE_DATA_BACKEND?: 'local' | 'wp';
  /** Базовый URL WordPress, например https://example.com (без /wp-json). */
  readonly VITE_WP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
