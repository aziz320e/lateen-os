/** @module events/types */
import { z } from 'zod';

export const sdkEventDefinitionSchema = z.object({
  name: z.string().regex(/^[a-z0-9_.]+$/),
  description: z.string().optional(),
  payloadSchema: z.record(z.unknown()).optional(),
});

export type SdkEventDefinition = z.infer<typeof sdkEventDefinitionSchema>;

export interface SdkEvent<TPayload = unknown> {
  readonly name: string;
  readonly payload: TPayload;
  readonly timestamp: string;
  readonly source?: string;
}

export type SdkEventHandler<TPayload = unknown> = (event: SdkEvent<TPayload>) => void | Promise<void>;
