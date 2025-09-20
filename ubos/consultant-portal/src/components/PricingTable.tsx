import StripeCheckoutButton from './StripeCheckoutButton';

function PricingTable() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold">Starter</h3>
        <p className="text-3xl font-bold mt-2">€0<span className="text-base font-medium">/month</span></p>
        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li>Upload up to 3 documents</li>
          <li>Basic compliance checks</li>
          <li>Email support</li>
        </ul>
      </div>

      <div className="bg-white border-2 border-eufm-primary rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Professional</h3>
        <p className="text-3xl font-bold mt-2">€299<span className="text-base font-medium">/month</span></p>
        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li>Unlimited uploads</li>
          <li>Advanced deadline tracking</li>
          <li>AI-generated opportunity matching</li>
          <li>Priority support</li>
        </ul>
        <div className="mt-6">
          <StripeCheckoutButton planId="pro-monthly" label="Start Professional" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold">Enterprise</h3>
        <p className="text-3xl font-bold mt-2">Custom</p>
        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li>Dedicated onboarding</li>
          <li>Enterprise SLA</li>
          <li>Custom integrations</li>
        </ul>
        <div className="mt-6">
          <a href="/contact" className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-black">Contact Sales</a>
        </div>
      </div>
    </div>
  );
}

export default PricingTable;

