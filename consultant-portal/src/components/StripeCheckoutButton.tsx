import { log } from '@lib/logger';

type Props = {
  planId: string;
  label?: string;
};

// Placeholder Stripe checkout button. Wire up to your backend to create a Checkout Session.
function StripeCheckoutButton({ planId, label = 'Subscribe' }: Props) {
  const publicKey = (import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY as string | undefined;

  const handleClick = async () => {
    try {
      if (!publicKey) {
        alert('Stripe key not configured. See README to set VITE_STRIPE_PUBLIC_KEY.');
        return;
      }
      log('info', 'Stripe checkout clicked', { planId });
      // In a real integration, call your backend to create a Checkout Session, then redirect.
      // This is a placeholder action.
      alert(`Pretending to start Stripe Checkout for plan: ${planId}`);
    } catch (err) {
      log('error', 'Stripe checkout failed', err);
      alert('Something went wrong starting checkout.');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full px-4 py-2 rounded bg-eufm-primary text-white hover:bg-sky-600"
      aria-label="Start Stripe checkout"
    >
      {label}
    </button>
  );
}

export default StripeCheckoutButton;

