import React, { useState, useEffect } from 'react';

export interface CustomerUsage {
  customerId: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  usage: {
    apiRequests: number;
    agentExecutions: number;
    dataAccessQueries: number;
    totalCost: number;
  };
  limits: {
    apiRequests: number;
    agentExecutions: number;
  };
}

export interface SubscriptionTier {
  id: string;
  name: string;
  priceId: string;
  monthlyPrice: number;
  features: {
    apiRequestsPerMonth: number;
    agentExecutionsPerMonth: number;
    dataAccessLevel: 'basic' | 'professional' | 'enterprise';
    supportLevel: 'community' | 'email' | 'priority';
  };
}

const subscriptionTiers: SubscriptionTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceId: 'price_starter_monthly',
    monthlyPrice: 29,
    features: {
      apiRequestsPerMonth: 1000,
      agentExecutionsPerMonth: 50,
      dataAccessLevel: 'basic',
      supportLevel: 'community'
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    priceId: 'price_professional_monthly',
    monthlyPrice: 99,
    features: {
      apiRequestsPerMonth: 10000,
      agentExecutionsPerMonth: 500,
      dataAccessLevel: 'professional',
      supportLevel: 'email'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceId: 'price_enterprise_monthly',
    monthlyPrice: 299,
    features: {
      apiRequestsPerMonth: 100000,
      agentExecutionsPerMonth: 5000,
      dataAccessLevel: 'enterprise',
      supportLevel: 'priority'
    }
  }
];

export const CustomerPortal: React.FC<{ customerId?: string }> = ({ customerId }) => {
  const [usage, setUsage] = useState<CustomerUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      if (customerId) {
        // In real implementation, fetch from API
        // const usageResponse = await fetch(`/api/customer/${customerId}/usage`);
        // const usageData = await usageResponse.json();
        setUsage({
          customerId,
          currentPeriodStart: Date.now() - (30 * 24 * 60 * 60 * 1000),
          currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000),
          usage: {
            apiRequests: 150,
            agentExecutions: 12,
            dataAccessQueries: 25,
            totalCost: 15.00
          },
          limits: {
            apiRequests: 1000,
            agentExecutions: 50
          }
        });
      }
    } catch (error) {
      console.error('Failed to load customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeSubscription = async (tier: SubscriptionTier) => {
    // Handle subscription upgrade/changes
    setSelectedTier(tier);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return (used / limit) * 100;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Portal</h1>
        <p className="text-gray-600">Manage your subscription and monitor your usage</p>
      </div>

      {/* Usage Overview */}
      {usage && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Current Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UsageCard
              title="API Requests"
              used={usage.usage.apiRequests}
              limit={usage.limits.apiRequests}
              total={usage.usage.apiRequests}
            />
            <UsageCard
              title="Agent Executions"
              used={usage.usage.agentExecutions}
              limit={usage.limits.agentExecutions}
              total={usage.usage.agentExecutions}
            />
            <UsageCard
              title="Total Cost"
              used={usage.usage.totalCost}
              limit={99} // Monthly budget
              total={usage.usage.totalCost}
              isCurrency={true}
            />
          </div>
          <div className="mt-6 text-sm text-gray-600">
            Billing period: {formatDate(usage.currentPeriodStart)} - {formatDate(usage.currentPeriodEnd)}
          </div>
        </div>
      )}

      {/* Subscription Tiers */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionTiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              isSelected={selectedTier?.id === tier.id}
              onSelect={() => upgradeSubscription(tier)}
            />
          ))}
        </div>
      </div>

      {/* Usage History */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Usage History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Event Type</th>
                <th className="px-4 py-2 text-left">Count</th>
                <th className="px-4 py-2 text-left">Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-2">2024-01-15</td>
                <td className="px-4 py-2">API Request</td>
                <td className="px-4 py-2">5</td>
                <td className="px-4 py-2">$0.50</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2">2024-01-14</td>
                <td className="px-4 py-2">Agent Execution</td>
                <td className="px-4 py-2">2</td>
                <td className="px-4 py-2">$2.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">API Keys</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">Development Key</div>
              <div className="text-sm text-gray-600">test-key-123</div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Regenerate
            </button>
          </div>
        </div>
        <button className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Create New API Key
        </button>
      </div>
    </div>
  );
};

const UsageCard: React.FC<{
  title: string;
  used: number;
  limit: number;
  total: number;
  isCurrency?: boolean;
}> = ({ title, used, limit, total, isCurrency = false }) => {
  const percentage = getUsagePercentage(used, limit);

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className="text-sm text-gray-600">
          {isCurrency ? formatCurrency(total) : total}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-600">
        {used} / {limit} used
      </div>
      {percentage > 80 && (
        <div className="text-xs text-red-600 mt-1">
          ⚠️ Nearing limit
        </div>
      )}
    </div>
  );
};

const TierCard: React.FC<{
  tier: SubscriptionTier;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ tier, isSelected, onSelect }) => {
  return (
    <div className={`border-2 rounded-lg p-6 ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold">{tier.name}</h3>
        <div className="text-3xl font-bold text-blue-600">${tier.monthlyPrice}/mo</div>
      </div>
      <ul className="space-y-2 mb-6">
        <li className="flex items-center">
          <span className="text-green-600 mr-2">✓</span>
          {tier.features.apiRequestsPerMonth.toLocaleString()} API requests
        </li>
        <li className="flex items-center">
          <span className="text-green-600 mr-2">✓</span>
          {tier.features.agentExecutionsPerMonth} agent executions
        </li>
        <li className="flex items-center">
          <span className="text-green-600 mr-2">✓</span>
          {tier.features.dataAccessLevel} data access
        </li>
        <li className="flex items-center">
          <span className="text-green-600 mr-2">✓</span>
          {tier.features.supportLevel} support
        </li>
      </ul>
      <button
        onClick={onSelect}
        className={`w-full py-2 px-4 rounded-lg font-medium ${
          isSelected
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }`}
      >
        {isSelected ? 'Current Plan' : 'Select Plan'}
      </button>
    </div>
  );
};

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

function getUsagePercentage(used: number, limit: number): number {
  return (used / limit) * 100;
}
