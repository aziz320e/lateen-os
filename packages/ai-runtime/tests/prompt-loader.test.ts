import { describe, expect, it } from 'vitest';
import { createPromptLoader, renderPrompt } from '../src/prompts/prompt-loader.js';

describe('renderPrompt', () => {
  it('substitutes a simple variable', () => {
    const result = renderPrompt({ name: 't', source: 'Hello {{name}}!' }, { name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('resolves dot-path variables', () => {
    const result = renderPrompt({ name: 't', source: 'Task: {{task.title}}' }, { task: { title: 'Ship it' } });
    expect(result).toBe('Task: Ship it');
  });

  it('throws in strict mode when a variable is missing', () => {
    expect(() => renderPrompt({ name: 't', source: '{{missing}}' }, {})).toThrow(/Missing value/);
  });

  it('leaves the placeholder untouched in non-strict mode when missing', () => {
    const result = renderPrompt({ name: 't', source: '{{missing}}' }, {}, { strict: false });
    expect(result).toBe('{{missing}}');
  });
});

describe('createPromptLoader', () => {
  it('registers and renders an inline template', () => {
    const loader = createPromptLoader();
    loader.register('greeting', 'Hi {{name}}');
    expect(loader.render('greeting', { name: 'Ada' })).toBe('Hi Ada');
  });

  it('get returns undefined for an unregistered template', () => {
    const loader = createPromptLoader();
    expect(loader.get('missing')).toBeUndefined();
  });

  it('render throws for an unknown template name', () => {
    const loader = createPromptLoader();
    expect(() => loader.render('missing', {})).toThrow(/Unknown prompt template/);
  });
});
