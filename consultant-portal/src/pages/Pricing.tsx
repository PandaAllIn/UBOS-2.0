import PricingTable from '@components/PricingTable';

function Pricing() {
  return (
    <section className="container-max py-10">
      <h2 className="text-2xl font-semibold">Pricing</h2>
      <p className="text-gray-600 mt-2">Choose the plan that fits — Professional at €299/month.</p>
      <div className="mt-6">
        <PricingTable />
      </div>
    </section>
  );
}

export default Pricing;

