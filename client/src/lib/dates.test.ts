import { describe, expect, it } from 'vitest';
import { addDays, eachDate, isoWeekDay, last7Days, parseIso, toIsoDate } from './dates';

describe('dates', () => {
  it('toIsoDate / parseIso — обратное преобразование', () => {
    expect(toIsoDate(parseIso('2026-10-22'))).toBe('2026-10-22');
  });

  it('addDays переходит границу месяца и года', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('isoWeekDay — ISO-нумерация (Пн=1 … Вс=7)', () => {
    expect(isoWeekDay('2026-10-22')).toBe(4); // четверг
    expect(isoWeekDay('2026-10-25')).toBe(7); // воскресенье
    expect(isoWeekDay('2026-10-26')).toBe(1); // понедельник
  });

  it('last7Days — ровно 7 дней, конец = переданная дата', () => {
    const days = last7Days('2026-10-22');
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-10-16');
    expect(days[6]).toBe('2026-10-22');
  });

  it('eachDate включает обе границы', () => {
    expect(eachDate('2026-10-20', '2026-10-22')).toEqual([
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
    ]);
  });
});
