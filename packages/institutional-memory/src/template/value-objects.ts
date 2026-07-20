/** @module template/value-objects */
/** Template variable binding at render time. */
export interface TemplateVariableBinding {
  readonly name: string;
  readonly value: string;
}
