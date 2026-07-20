import pino from 'pino';

export function createLogger(level: string) {
  return pino({
    level,
    ...(process.env.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
      : {}),
    base: { service: 'business-dna-service' },
  });
}

export type Logger = ReturnType<typeof createLogger>;
