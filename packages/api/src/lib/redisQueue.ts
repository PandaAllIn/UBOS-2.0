import { Queue, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';

const connection = process.env.REDIS_URL ? new IORedis(process.env.REDIS_URL) : undefined as any;
export const queue = connection ? new Queue('orchestrate', { connection }) : undefined;

export function enabled(): boolean { return !!queue; }

export async function enqueueRedis(name: string, data: any, opts?: JobsOptions) {
  if (!queue) throw new Error('Redis queue not enabled');
  await queue.add(name, data, opts);
}

export function startRedisWorker() {
  if (!connection) return;
  const worker = new Worker('orchestrate', async (job) => {
    // Simulate work; integrate provider calls per job.data later
    await new Promise(r => setTimeout(r, 100));
    return { ok: true };
  }, { connection });
  worker.on('failed', (job, err) => console.error('Job failed', job?.id, err));
}


