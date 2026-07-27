/**
 * Vision & Mission — singleton-per-organization vision, mission, values,
 * and strategic objectives.
 * @module vision-mission
 */
export * from './types.js';
export * from './repository.js';
export { createVisionMissionRepository } from './repository.impl.js';
export {
  createVisionMissionEngine,
  canTransitionObjective,
  type VisionMissionEngine,
  type SetVisionMissionInput,
  type AddStrategicObjectiveInput,
} from './engine.impl.js';
