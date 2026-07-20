const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../../extensions');
const cfg = `{
  "extends": "@lateen-os/typescript-config/node.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true
  },
  "include": ["src"]
}
`;

for (const f of fs.readdirSync(dir)) {
  const full = path.join(dir, f);
  if (fs.statSync(full).isDirectory()) {
    fs.writeFileSync(path.join(full, 'tsconfig.json'), cfg);
    console.log('fixed', f);
  }
}
