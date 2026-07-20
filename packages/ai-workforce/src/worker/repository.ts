/** @module worker/repository */
import type { Repository } from '../shared/repository.js';
import type { AIWorker, WorkerId } from './types.js';

export type WorkerRepository = Repository<AIWorker, WorkerId>;
