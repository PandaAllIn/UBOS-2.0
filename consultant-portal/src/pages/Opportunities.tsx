import { useEffect } from 'react';
import { useAppStore } from '@store/useAppStore';

function Opportunities() {
  const { opportunities, generateDemoOpportunities } = useAppStore((s) => ({
    opportunities: s.opportunities,
    generateDemoOpportunities: s.generateDemoOpportunities,
  }));

  useEffect(() => {
    if (opportunities.length === 0) generateDemoOpportunities();
  }, [opportunities.length, generateDemoOpportunities]);

  return (
    <section className="container-max py-10">
      <h2 className="text-2xl font-semibold">Matched Opportunities</h2>
      <p className="text-gray-600 mt-2">Demo results based on your uploaded documents.</p>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {opportunities.map((o) => (
          <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{o.title}</h3>
                <p className="text-sm text-gray-600">{o.program}</p>
              </div>
              <span className="text-sm font-medium text-eufm-dark">{o.amount}</span>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded">
                <div className="h-2 bg-eufm-primary rounded" style={{ width: `${o.matchScore}%` }} />
              </div>
              <p className="text-xs text-gray-600 mt-2">Match score: {o.matchScore}%</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Opportunities;

