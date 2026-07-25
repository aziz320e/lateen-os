import { describe, expect, it } from 'vitest';
import { createForecaster } from '../src/forecasting/forecaster.impl.js';

describe('createForecaster', () => {
  it('uses moving-average for short history', () => {
    const forecaster = createForecaster();
    const forecast = forecaster.forecast({
      organizationId: 'org-1',
      subjectType: 'product',
      period: '30d',
      history: [
        { timestamp: '2026-01-01', value: 100 },
        { timestamp: '2026-01-02', value: 110 },
      ],
    });
    expect(forecast.model).toBe('moving_average');
    expect(parseFloat(forecast.predictedValue)).toBeCloseTo(105, 0);
  });

  it('uses linear regression once there are at least 4 points, projecting the trend', () => {
    const forecaster = createForecaster();
    const forecast = forecaster.forecast({
      organizationId: 'org-1',
      subjectType: 'product',
      period: '30d',
      history: [
        { timestamp: '1', value: 100 },
        { timestamp: '2', value: 110 },
        { timestamp: '3', value: 120 },
        { timestamp: '4', value: 130 },
      ],
    });
    expect(forecast.model).toBe('regression');
    // Perfect linear trend +10/step over 4 points -> next point should be ~140.
    expect(parseFloat(forecast.predictedValue)).toBeCloseTo(140, 0);
  });

  it('increases confidence with more historical data, capped at 0.9', () => {
    const forecaster = createForecaster();
    const short = forecaster.forecast({
      organizationId: 'org-1',
      subjectType: 'product',
      period: '30d',
      history: [{ timestamp: '1', value: 1 }],
    });
    const long = forecaster.forecast({
      organizationId: 'org-1',
      subjectType: 'product',
      period: '30d',
      history: Array.from({ length: 10 }, (_, i) => ({ timestamp: String(i), value: i })),
    });
    expect(parseFloat(long.confidence.score)).toBeGreaterThan(parseFloat(short.confidence.score));
    expect(parseFloat(long.confidence.score)).toBeLessThanOrEqual(0.9);
  });

  it('sets forecastTo based on the requested period length', () => {
    const forecaster = createForecaster();
    const forecast = forecaster.forecast({
      organizationId: 'org-1',
      subjectType: 'kpi',
      period: '7d',
      history: [{ timestamp: '1', value: 1 }],
    });
    const fromMs = new Date(forecast.forecastFrom).getTime();
    const toMs = new Date(forecast.forecastTo).getTime();
    expect(Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000))).toBe(7);
  });

  it('handles empty history without throwing', () => {
    const forecaster = createForecaster();
    const forecast = forecaster.forecast({
      organizationId: 'org-1',
      subjectType: 'kpi',
      period: '7d',
      history: [],
    });
    expect(forecast.predictedValue).toBe('0.0000');
  });
});
