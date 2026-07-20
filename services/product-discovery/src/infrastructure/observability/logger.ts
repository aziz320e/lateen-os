import pino from 'pino';

export function createLogger(level: string) {
  return pino({
    level,
    base: { service: 'product-discovery-service' },
    ...(process.env.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
      : {}),
  });
}

export type Logger = ReturnType<typeof createLogger>;
