/** @module condition/repository */
import type { Repository } from '../shared/repository.js';
import type { ConditionId, Expression, ExpressionId, PolicyCondition, Rule, RuleId } from './types.js';

export type ExpressionRepository = Repository<Expression, ExpressionId>;
export type RuleRepository = Repository<Rule, RuleId>;
export type PolicyConditionRepository = Repository<PolicyCondition, ConditionId>;
