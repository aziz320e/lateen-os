const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../../../extensions');
const adapterFiles = [
  { file: 'sync.ts', export: 'syncAdapter', prop: 'sync' },
  { file: 'webhook.ts', export: 'webhookAdapter', prop: 'webhook' },
  { file: 'health.ts', export: 'healthAdapter', prop: 'health' },
];

for (const f of fs.readdirSync(dir)) {
  const adaptersDir = path.join(dir, f, 'src', 'adapters');
  if (!fs.existsSync(adaptersDir)) continue;
  for (const { file, export: exportName, prop } of adapterFiles) {
    fs.writeFileSync(
      path.join(adaptersDir, file),
      `import { provider } from '../provider.js';\nexport { provider };\nexport const ${exportName} = provider.${prop};\n`,
    );
  }
  console.log('fixed adapters', f);
}
