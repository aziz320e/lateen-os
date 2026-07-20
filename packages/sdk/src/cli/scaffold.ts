/** @module cli/scaffold */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { getTemplate, type TemplateKind } from '../templates/registry.js';

export interface ScaffoldOptions {
  readonly workspaceRoot: string;
  readonly kind: TemplateKind;
  readonly name: string;
  readonly targetDir?: string;
}

export function scaffoldExtension(options: ScaffoldOptions): readonly string[] {
  const target = options.targetDir ?? join(options.workspaceRoot, 'extensions', options.name);

  if (existsSync(target)) {
    throw new Error(`Target directory already exists: ${target}`);
  }

  mkdirSync(target, { recursive: true });
  const bundle = getTemplate(options.kind, options.name);
  const written: string[] = [];

  for (const file of bundle.files) {
    const filePath = join(target, file.path);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, file.content, 'utf8');
    written.push(filePath);
  }

  return written;
}

export function initSdkProject(workspaceRoot: string): readonly string[] {
  const target = join(workspaceRoot, 'lateen.extension.json');
  if (existsSync(target)) {
    throw new Error('lateen.extension.json already exists');
  }

  writeFileSync(
    target,
    JSON.stringify(
      {
        name: 'my-extension',
        sdkVersion: '1.0.0',
        architecture: '1.0',
        extensions: [],
      },
      null,
      2,
    ),
    'utf8',
  );

  return [target];
}
