import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePricingJson() {
  let cityData, fetchCityPricing;
  try {
    ({ cityData } = await import('../src/data/cities'));
    ({ fetchCityPricing } = await import('../src/services/api'));
  } catch (importErr) {
    console.error('Import error:', importErr?.stack || importErr);
    process.exit(1);
  }

  const allPricing: Record<string, any> = {};

  for (const city of cityData) {
    try {
      const pricing = await fetchCityPricing(city);
      allPricing[city.city_name] = pricing;
    } catch (error) {
      console.error(`Failed to fetch pricing for ${city.city_name}:`, error?.stack || error);
    }
  }

  const outputPath = path.resolve(__dirname, '../public/pricing.json');
  fs.writeFileSync(outputPath, JSON.stringify(allPricing, null, 2));
  console.log(`Pricing data written to ${outputPath}`);
}

(async () => {
  try {
    await generatePricingJson();
  } catch (err) {
    console.error('Script failed:', err?.stack || err);
    process.exit(1);
  }
})();
