/** @module step/repository */
import type { Repository } from '../shared/repository.js';
import type { StepInstance, StepInstanceId } from './types.js';

export type StepInstanceRepository = Repository<StepInstance, StepInstanceId>;
