import { cityData } from '../src/data/cities';

async function checkAllDayDeals() {
  const results: { city: string; hasPassOffers: boolean; passOffersCount: number; error?: string }[] = await Promise.all(
    cityData.map(async (city) => {
      try {
        const url = city.day_deals_api_url;
        const response = await fetch(url, { headers: { 'accept': 'application/com.donkeyrepublic.v8' } });
        if (!response.ok) {
          return { city: city.city_name, hasPassOffers: false, passOffersCount: 0, error: `HTTP ${response.status}` };
        }
        const data = await response.json();
        const passOffers = Array.isArray(data.accounts.pass_offers) ? data.accounts.pass_offers : [];
        return { city: city.city_name, hasPassOffers: passOffers.length > 0, passOffersCount: passOffers.length };
      } catch (e: any) {
        return { city: city.city_name, hasPassOffers: false, passOffersCount: 0, error: e.message };
      }
    })
  );

  // Print summary
  console.log('Donkey Bike Day Deals Pass Offers Summary:');
  for (const r of results) {
    if (r.error) {
      console.log(`${r.city}: ERROR (${r.error})`);
    } else {
      console.log(`${r.city}: pass_offers=${r.hasPassOffers ? 'YES' : 'NO'} count=${r.passOffersCount}`);
    }
  }
}

checkAllDayDeals();
