import { UBOSKernel } from '../../src/kernel/kernel';

describe('UBOS Kernel', () => {
  test('should boot successfully', async () => {
    const kernel = new UBOSKernel();
    await expect(kernel.boot()).resolves.not.toThrow();
  });

  test('should interpret specs', async () => {
    const kernel = new UBOSKernel();
    await kernel.boot();
    const spec = await kernel.interpretSpec('constitution.spec.md');
    expect(spec).toBeDefined();
    expect(spec.metadata).toBeDefined();
  });
});

