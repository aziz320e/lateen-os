import { CronExpressionParser } from 'cron-parser';
import type { CronEvaluatorPort } from '../domain/ports';

export class CronEvaluator implements CronEvaluatorPort {
  isValid(cronExpression: string): boolean {
    try {
      CronExpressionParser.parse(cronExpression);
      return true;
    } catch {
      return false;
    }
  }

  nextRun(cronExpression: string, timezone: string, from = new Date()): Date | null {
    try {
      const interval = CronExpressionParser.parse(cronExpression, { currentDate: from, tz: timezone });
      return interval.next().toDate();
    } catch {
      return null;
    }
  }
}
