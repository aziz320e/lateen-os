import type { CalendarEvaluatorPort } from '../domain/ports';
import type { CalendarRule } from '../domain/types';

export class CalendarEvaluator implements CalendarEvaluatorPort {
  isWithinWorkingHours(rule: CalendarRule, at: Date): boolean {
    if (!rule.enabled) return true;

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: rule.timezone,
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(at);
    const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);

    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = dayMap[weekday] ?? 0;

    if (!rule.workingDays.includes(day)) return false;
    if (hour < rule.startHour || hour >= rule.endHour) return false;

    const dateStr = at.toISOString().slice(0, 10);
    if (rule.holidays.includes(dateStr)) return false;

    return true;
  }

  nextWorkingSlot(rule: CalendarRule, from: Date): Date {
    const candidate = new Date(from);
    for (let i = 0; i < 14 * 24; i++) {
      candidate.setHours(candidate.getHours() + 1);
      if (this.isWithinWorkingHours(rule, candidate)) return candidate;
    }
    return new Date(from.getTime() + 3600_000);
  }
}
