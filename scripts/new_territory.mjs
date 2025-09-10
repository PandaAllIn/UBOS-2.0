#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const name = (process.argv[2] || '').trim();
  if (!name) {
    console.error('Usage: node scripts/new_territory.mjs <territory-name>');
    process.exit(1);
  }
  const targetDir = path.join('ubos', 'specs', 'territories');
  await fs.mkdir(targetDir, { recursive: true });

  const tmpl = await fs.readFile(path.join('templates', 'territory', 'TERRITORY_SPEC.md'), 'utf8');
  const content = tmpl.replace(/\{\{TERRITORY_NAME\}\}/g, name);
  const file = path.join(targetDir, `${name}.spec.md`);
  await fs.writeFile(file, content);
  console.log(`✅ Created territory spec: ${file}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

