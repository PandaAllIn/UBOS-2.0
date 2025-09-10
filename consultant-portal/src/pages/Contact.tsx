import { FormEvent, useState } from 'react';
import { log } from '@lib/logger';

function Contact() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const form = new FormData(e.currentTarget);
      const payload = Object.fromEntries(form.entries());
      log('info', 'Demo request submitted', payload);
      await new Promise((r) => setTimeout(r, 500));
      setStatus('submitted');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <section className="container-max py-10">
      <h2 className="text-2xl font-semibold">Request a Demo</h2>
      <p className="text-gray-600 mt-2">Tell us about your use case. We’ll get in touch.</p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 max-w-xl">
        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <input name="name" required className="mt-1 w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Email</label>
          <input type="email" name="email" required className="mt-1 w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Company</label>
          <input name="company" className="mt-1 w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Message</label>
          <textarea name="message" rows={4} className="mt-1 w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <button
          disabled={status === 'submitting'}
          className="px-4 py-2 rounded bg-eufm-primary text-white hover:bg-sky-600 disabled:opacity-60"
        >
          {status === 'submitting' ? 'Submitting…' : 'Request Demo'}
        </button>
        {status === 'submitted' && <p className="text-green-600 text-sm">Thanks! We’ll reach out soon.</p>}
        {status === 'error' && <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>}
      </form>
    </section>
  );
}

export default Contact;

