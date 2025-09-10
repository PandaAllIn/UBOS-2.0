import { UBOSKernel } from '../kernel/kernel';
import { Citizen } from '../citizens/citizen';
import { EUFMTerritory } from '../territories/eufm.territory';

async function firstContact() {
  const kernel = new UBOSKernel();
  await kernel.boot();

  const citizen = new Citizen('user-001');
  await citizen.credits.earn(100, 'welcome-bonus');

  const eufm = new EUFMTerritory();
  const serviceId = 'eu-discovery';

  // Spend credits for the service
  const price = 100;
  const spent = await citizen.credits.spend(price, 'EU Funding Discovery');
  if (!spent) throw new Error('Unable to spend credits for service');

  await eufm.requestService(
    serviceId,
    { sector: 'renewable-energy', country: 'Romania' },
    citizen.credits.getBalance()
  );

  console.log('🎉 UBOS IS ALIVE AND OPERATIONAL!');
}

firstContact().catch((err) => {
  console.error('❌ First contact failed:', err);
  process.exit(1);
});

