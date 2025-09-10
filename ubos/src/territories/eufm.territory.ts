export type Service = { id: string; name?: string; price: number; description?: string };

export class EUFMTerritory {
  private services: Service[];

  constructor(services?: Service[]) {
    this.services = services || [
      { id: 'eu-discovery', name: 'EU Funding Discovery', price: 100, description: 'Find relevant EU funding opportunities' },
      { id: 'proposal-writing', name: 'Proposal Writing', price: 1000, description: 'Complete EU proposal generation' },
    ];
  }

  async initialize() {
    console.log('🏛️ EUFM Territory Initialized');
    console.log('📋 Available Services:');
    this.services.forEach((s) => {
      console.log(`  - ${s.name}: ${s.price} credits`);
    });
  }

  async requestService(serviceId: string, params: any, credits: number) {
    const service = this.services.find((s) => s.id === serviceId);
    if (!service) throw new Error('Service not found');

    if (credits < service.price) {
      throw new Error(`Need ${service.price} credits, have ${credits}`);
    }

    console.log(`🔧 Executing: ${service.name}`);
    // Execute service logic here

    return {
      success: true,
      result: `${service.name} completed successfully`,
    };
  }

  getService(serviceId: string) {
    return this.services.find((s) => s.id === serviceId) || null;
  }

  listServices() {
    return [...this.services];
  }
}
