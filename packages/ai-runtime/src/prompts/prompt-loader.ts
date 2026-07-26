/**
 * Real prompt template loading and interpolation. Deliberately
 * dependency-free — a minimal `{{variable}}` substitution engine, not a
 * full templating library, since prompt templates don't need control flow.
 *
 * @module prompts/prompt-loader
 */
import { readFileSync } from 'node:fs';

export interface PromptTemplate {
  readonly name: string;
  readonly source: string;
}

export interface RenderOptions {
  /** Throws if a `{{variable}}` in the template has no matching value. Defaults to true. */
  readonly strict?: boolean;
}

const VARIABLE_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

function getByPath(values: Readonly<Record<string, unknown>>, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined), values);
}

/** Substitutes every `{{variable}}` (dot-path supported) in a template with a value from `values`. */
export function renderPrompt(
  template: PromptTemplate,
  values: Readonly<Record<string, unknown>>,
  options: RenderOptions = {},
): string {
  const strict = options.strict ?? true;
  return template.source.replace(VARIABLE_PATTERN, (match, path: string) => {
    const value = getByPath(values, path);
    if (value === undefined) {
      if (strict) {
        throw new Error(`Missing value for prompt variable "${path}" in template "${template.name}"`);
      }
      return match;
    }
    return String(value);
  });
}

export interface PromptLoader {
  /** Registers an inline template (no filesystem access). */
  register(name: string, source: string): PromptTemplate;
  /** Loads a template from disk relative to the loader's base directory. */
  loadFromFile(name: string, relativePath: string): PromptTemplate;
  get(name: string): PromptTemplate | undefined;
  render(name: string, values: Readonly<Record<string, unknown>>, options?: RenderOptions): string;
}

/** Creates a {@link PromptLoader}. `baseDir` scopes `loadFromFile`'s relative paths; omit it to only use `register`. */
export function createPromptLoader(baseDir?: string): PromptLoader {
  const templates = new Map<string, PromptTemplate>();

  return {
    register(name, source) {
      const template: PromptTemplate = { name, source };
      templates.set(name, template);
      return template;
    },
    loadFromFile(name, relativePath) {
      const path = baseDir ? `${baseDir}/${relativePath}` : relativePath;
      const source = readFileSync(path, 'utf8');
      const template: PromptTemplate = { name, source };
      templates.set(name, template);
      return template;
    },
    get(name) {
      return templates.get(name);
    },
    render(name, values, options) {
      const template = templates.get(name);
      if (!template) {
        throw new Error(`Unknown prompt template "${name}"`);
      }
      return renderPrompt(template, values, options);
    },
  };
}
