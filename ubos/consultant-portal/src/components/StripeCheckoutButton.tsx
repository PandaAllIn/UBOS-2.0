import { log } from '@lib/logger';

type Props = {
  planId: string;
  label?: string;
};

function StripeCheckoutButton({ planId, label = 'Subscribe' }: Props) {
  const handleClick = async () => {
    try {
      log('info', 'Stripe checkout clicked', { planId });
      
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: planId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
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

