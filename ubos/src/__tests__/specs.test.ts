import { SpecInterpreter } from '../kernel/spec-interpreter';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('UBOS specs validation', () => {
  const interpreter = new SpecInterpreter();

  it('validates kernel constitution', async () => {
    const spec = await interpreter.parseSpec('specs/kernel/constitution.spec.md');
    expect(spec.metadata.version).toMatch(/\d+\.\d+\.\d+/);
  });

  it('validates all territory specs', async () => {
    const dir = path.resolve(process.cwd(), 'specs', 'territories');
    const files = await fs.readdir(dir);
    for (const f of files) {
      if (!f.endsWith('.spec.md')) continue;
      const spec = await interpreter.parseSpec(path.join(dir, f));
      expect(spec.metadata.type).toBeTruthy();
    }
  });
});

