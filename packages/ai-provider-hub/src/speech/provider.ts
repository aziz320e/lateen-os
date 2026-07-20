/** @module speech/provider */
import type {
  SpeechToTextRequest,
  SpeechToTextResult,
  TextToSpeechRequest,
  TextToSpeechResult,
} from './types.js';

/** Speech capability port (STT + TTS). */
export interface SpeechProvider {
  transcribe(request: SpeechToTextRequest): Promise<SpeechToTextResult>;
  synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult>;
}
