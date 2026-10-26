/**
 * Линейные (outline) SVG-иконки TrackTel — см. docs/Brandbook.md, раздел «Иконки».
 * Монохромные, обводка 1.8px, stroke: currentColor, fill: none.
 * Декоративные: контейнер скрывает их от скринридера (aria-hidden).
 */
interface IconProps {
  size?: number;
}

function svgProps(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

/** «Сегодня» — галочка в круге */
export function IconCheckCircle({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </svg>
  );
}

/** «Привычки» — цикл (повторяющееся действие) */
export function IconRepeat({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" />
      <path d="M4 20v-4h4" />
    </svg>
  );
}

/** «Задачи» — квадрат чек-бокса */
export function IconSquareCheck({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </svg>
  );
}

/** «Отчёты» — список строк */
export function IconList({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </svg>
  );
}

/** «Настройки» — шестерёнка */
export function IconGear({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" />
    </svg>
  );
}
