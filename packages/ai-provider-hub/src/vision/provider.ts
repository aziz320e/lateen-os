/** @module vision/provider */
import type { VisionRequest, VisionResult } from './types.js';

/** Vision/multimodal capability port. */
export interface VisionProvider {
  analyze(request: VisionRequest): Promise<VisionResult>;
  supportsMimeType(mimeType: string): boolean;
}
