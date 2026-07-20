/** @module image/provider */
import type { ImageGenerationRequest, ImageGenerationResult } from './types.js';

/** Image generation capability port. */
export interface ImageProvider {
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}
