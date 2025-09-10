export type GenericService = { id: string; name?: string; price: number; description?: string };

export class GenericTerritory {
  constructor(private territoryId: string, private displayName: string, private services: GenericService[]) {}

  async initialize() {
    console.log(`🏛️ ${this.displayName} Territory Initialized`);
    console.log('📋 Available Services:');
    this.services.forEach((s) => {
      console.log(`  - ${s.name || s.id}: ${s.price} credits`);
    });
  }

  async requestService(serviceId: string, params: any, credits: number) {
    const service = this.services.find((s) => s.id === serviceId);
    if (!service) throw new Error('Service not found');
    if (credits < service.price) throw new Error(`Need ${service.price} credits, have ${credits}`);
    console.log(`🔧 Executing: ${service.name || service.id}`);
    return { success: true, result: `${service.name || service.id} completed successfully` };
  }

  getService(serviceId: string) {
    return this.services.find((s) => s.id === serviceId) || null;
  }

  listServices() {
    return [...this.services];
  }
}

