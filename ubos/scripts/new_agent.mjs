#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const type = (process.argv[2] || '').trim();
  const className = (process.argv[3] || '').trim();
  if (!type || !className) {
    console.error('Usage: node scripts/new_agent.mjs <AGENT_TYPE> <ClassName>');
    process.exit(1);
  }
  const outDir = path.join('src', 'agents');
  await fs.mkdir(outDir, { recursive: true });
  const tmpl = await fs.readFile(path.join('templates', 'agent', 'AGENT_TEMPLATE.ts'), 'utf8');
  const content = tmpl.replace(/\{\{AGENT_TYPE\}\}/g, type).replace(/\{\{CLASS_NAME\}\}/g, className);
  const file = path.join(outDir, `${className[0].toLowerCase()}${className.slice(1)}.ts`);
  await fs.writeFile(file, content);
  console.log(`✅ Created agent skeleton: ${file}`);
  console.log('ℹ️  Remember to register it in src/orchestrator/agentFactory.ts');
}

main().catch((e) => { console.error(e); process.exit(1); });

