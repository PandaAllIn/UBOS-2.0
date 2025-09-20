type Job = { id: string; tenantId?: string; input: unknown };
type Listener = (event: { type: string; data: unknown }) => void;

const q: Job[] = [];
const listeners = new Set<Listener>();

export function enqueue(job: Job) {
  q.push(job);
  emit({ type: 'task.created', data: { id: job.id, tenantId: job.tenantId } });
}

export function onEvent(l: Listener) { listeners.add(l); return () => listeners.delete(l); }

function emit(evt: { type: string; data: unknown }) {
  for (const l of listeners) { try { l(evt); } catch (e) { console.error(e) } }
}

export function startWorker() {
  setInterval(() => {
    const job = q.shift();
    if (!job) return;
    emit({ type: 'request.started', data: { id: job.id } });
    // simulate processing
    setTimeout(() => emit({ type: 'request.completed', data: { id: job.id } }), 150);
  }, 200);
}


