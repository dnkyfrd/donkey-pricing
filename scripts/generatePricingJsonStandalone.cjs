// Standalone Node.js script to fetch pricing for all cities and write to public/pricing.json
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
global.fetch = fetch;

// Full city list from cities.ts
const cityData = [
    {"city_name": "Lausanne EPFL", "city_app_id": 53, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=46.519962,6.633597&country_code=CH", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=46.519962,6.633597", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=46.519962,6.633597&filter_type=radius&radius=5000" },
    {"city_name": "Oegstgeest", "city_app_id": 645, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=52.1862262,4.4748104&country_code=NL", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=52.1862262,4.4748104", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=52.1862262,4.4748104&filter_type=radius&radius=5000" },
    {"city_name": "Leiden", "city_app_id": 644, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=52.1636188,4.4802444&country_code=NL", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=52.1636188,4.4802444", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=52.1636188,4.4802444&filter_type=radius&radius=5000" },
    {"city_name": "Katwijk", "city_app_id": 643, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=52.1992517,4.4114135&country_code=NL", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=52.1992517,4.4114135", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=52.1992517,4.4114135&filter_type=radius&radius=5000" },
    {"city_name": "Mechelen Region", "city_app_id": 639, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=51.0259143,4.4775553&country_code=BE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=51.0259143,4.4775553", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=51.0259143,4.4775553&filter_type=radius&radius=5000" },
    {"city_name": "Schlei Region", "city_app_id": 866, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=54.3438625,10.1226193&country_code=DE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=54.3438625,10.1226193", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=54.3438625,10.1226193&filter_type=radius&radius=5000" },
    {"city_name": "Helsingør", "city_app_id": 599, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=56.030787,12.592127&country_code=DK", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=56.030787,12.592127", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=56.030787,12.592127&filter_type=radius&radius=5000" },
    {"city_name": "Hanover", "city_app_id": 592, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=52.3758916,9.7320104&country_code=DE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=52.3758916,9.7320104", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=52.3758916,9.7320104&filter_type=radius&radius=5000" },
    {"city_name": "Waasland", "city_app_id": 309, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=51.2144,4.1265&country_code=BE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=51.2144,4.1265", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=51.2144,4.1265&filter_type=radius&radius=5000" },
    {"city_name": "Kreuzlingen", "city_app_id": 304, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=47.6405685,9.1729994&country_code=CH", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=47.6405685,9.1729994", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=47.6405685,9.1729994&filter_type=radius&radius=5000" },
    {"city_name": "Prignitz", "city_app_id": 594, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=53.0819589,11.8598802&country_code=DE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=53.0819589,11.8598802", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=53.0819589,11.8598802&filter_type=radius&radius=5000" },
    {"city_name": "Thun", "city_app_id": 247, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=46.7579868,7.6279881&country_code=CH", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=46.7579868,7.6279881", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=46.7579868,7.6279881&filter_type=radius&radius=5000" },
    {"city_name": "Dordecht", "city_app_id": 355, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=51.8144387,4.6672405&country_code=NL", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=51.8144387,4.6672405", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=51.8144387,4.6672405&filter_type=radius&radius=5000" },
    {"city_name": "Le Locle", "city_app_id": 216, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=47.056301,6.746850&country_code=CH", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=47.056301,6.746850", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=47.056301,6.746850&filter_type=radius&radius=5000" },
    {"city_name": "Veurne", "city_app_id": 475, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=51.073177,2.6680397&country_code=BE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=51.073177,2.6680397", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=51.073177,2.6680397&filter_type=radius&radius=5000" },
    {"city_name": "Koksijde", "city_app_id": 559, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=51.1054229,2.6501559&country_code=BE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=51.1054229,2.6501559", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=51.1054229,2.6501559&filter_type=radius&radius=5000" },
    {"city_name": "De Panne", "city_app_id": 561, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=51.0954751,2.58877&country_code=BE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=51.0954751,2.58877", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=51.0954751,2.58877&filter_type=radius&radius=5000" },
    {"city_name": "Kiel Region", "city_app_id": 516, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=54.3438625,10.1226193&country_code=DE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=54.3438625,10.1226193", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=54.3438625,10.1226193&filter_type=radius&radius=5000" },
    {"city_name": "Turku", "city_app_id": 345, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=60.4518126,22.2666303&country_code=FI", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=60.4518126,22.2666303", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=60.4518126,22.2666303&filter_type=radius&radius=5000" },
    {"city_name": "Geneva", "city_app_id": 217, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=46.2043907,6.1431577&country_code=CH", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=46.2043907,6.1431577", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=46.2043907,6.1431577&filter_type=radius&radius=5000" },
    {"city_name": "Amsterdam", "city_app_id": 5, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=52.3702157,4.8951679&country_code=NL", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=52.3702157,4.8951679", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=52.3702157,4.8951679&filter_type=radius&radius=5000" },
    {"city_name": "Ochtrup", "city_app_id": 350, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=52.2056952,7.1876491&country_code=DE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=52.2056952,7.1876491", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=52.2056952,7.1876491&filter_type=radius&radius=5000" },
    {"city_name": "Ven", "city_app_id": 16, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=55.0,12.0&country_code=SE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=55.0,12.0", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=55.0,12.0&filter_type=radius&radius=5000" },
    {"city_name": "Antwerp", "city_app_id": 309, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=51.2213,4.4051&country_code=BE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=51.2213,4.4051", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=51.2213,4.4051&filter_type=radius&radius=5000" },
    {"city_name": "Varberg", "city_app_id": 315, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=57.107118,12.2520907&country_code=SE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=57.107118,12.2520907", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=57.107118,12.2520907&filter_type=radius&radius=5000" },
    {"city_name": "Straubing", "city_app_id": 336, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=48.8777333,12.5801538&country_code=DE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=48.8777333,12.5801538", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=48.8777333,12.5801538&filter_type=radius&radius=5000" },
    {"city_name": "Randers", "city_app_id": 308, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=56.460584,10.036539&country_code=DK", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=56.460584,10.036539", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=56.460584,10.036539&filter_type=radius&radius=5000" },
    {"city_name": "The Hague", "city_app_id": 306, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=52.0704978,4.3006999&country_code=NL", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=52.0704978,4.3006999", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=52.0704978,4.3006999&filter_type=radius&radius=5000" },
    {"city_name": "Ghent", "city_app_id": 223, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=51.0543422,3.7174243&country_code=BE", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=51.0543422,3.7174243", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=51.0543422,3.7174243&filter_type=radius&radius=5000" },
    {"city_name": "Rotterdam", "city_app_id": 21, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=51.9242897,4.4784456&country_code=NL", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=51.9242897,4.4784456", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=51.9242897,4.4784456&filter_type=radius&radius=5000" },
    {"city_name": "Barcelona", "city_app_id": 8, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=41.3850639,2.1734035&country_code=ES", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=41.3850639,2.1734035", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=41.3850639,2.1734035&filter_type=radius&radius=5000" },
    {"city_name": "Copenhagen", "city_app_id": 1, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=55.6760968,12.5683372&country_code=DK", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=55.6760968,12.5683372", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=55.6760968,12.5683372&filter_type=radius&radius=5000" },
    {"city_name": "Roskilde", "city_app_id": 19, "memberships_api_url": "https://stables.donkey.bike/api/public/plans?location=55.6413314,12.0809966&country_code=DK", "just_ride_api_url": "https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=55.6413314,12.0809966", "day_deals_api_url": "https://stables.donkey.bike/api/public/nearby?location=55.6413314,12.0809966&filter_type=radius&radius=10000" }
];

async function fetchPricing(city) {
  async function safeFetch(url, headers, label) {
    try {
      const res = await fetch(url, { headers });
      const status = res.status;
      let text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = null; }
      console.log(`FETCH [${label}] ${city.city_name} ${url} -> ${status}`);
      if (status !== 200) {
        console.log(`  ERROR: HTTP ${status} - ${text.slice(0, 200)}`);
      } else {
        console.log(`  RESPONSE: ${text.slice(0, 200)}`);
      }
      return json;
    } catch (e) {
      console.log(`  FETCH ERROR [${label}] ${city.city_name}:`, e);
      return null;
    }
  }

  // MEMBERSHIPS
  const membershipsRaw = await safeFetch(city.memberships_api_url, { 'accept': 'application/com.donkeyrepublic.v8', 'User-Agent': 'Mozilla/5.0 (compatible; DonkeyRepublic-PricingScript/1.0)' }, 'memberships');
  let memberships = [];
  if (Array.isArray(membershipsRaw)) {
    memberships = membershipsRaw.map((plan, idx) => ({
      id: plan.id || `plan-${idx}`,
      name: plan.name || plan.title || 'Plan',
      price: parseFloat(plan.price) || 0,
      currency: plan.currency || '',
      period: plan.interval || 'month',
      short_description: plan.short_description || plan.description || '',
      popular: !!plan.featured
    }));
  } else if (membershipsRaw && Array.isArray(membershipsRaw.plans)) {
    memberships = membershipsRaw.plans.map((plan, idx) => ({
      id: plan.id || `plan-${idx}`,
      name: plan.name || plan.title || 'Plan',
      price: parseFloat(plan.price) || 0,
      currency: plan.currency || '',
      period: plan.interval || 'month',
      short_description: plan.short_description || plan.description || '',
      popular: !!plan.featured
    }));
  } else if (membershipsRaw && membershipsRaw.plan) {
    memberships = [membershipsRaw.plan];
  } else {
    console.log(`  WARNING: No memberships found for ${city.city_name}`);
  }

  // JUST RIDE
  const justRideRaw = await safeFetch(city.just_ride_api_url, { 'accept': 'application/com.donkeyrepublic.v4', 'User-Agent': 'Mozilla/5.0 (compatible; DonkeyRepublic-PricingScript/1.0)' }, 'justRide');
  let justRide = [];
  if (Array.isArray(justRideRaw)) {
    justRide = justRideRaw.map((pricing, idx) => {
      let pricingTiers = [];
      if (pricing.duration && Array.isArray(pricing.duration.tiers)) {
        pricingTiers = pricing.duration.tiers.map((tier) => ({
          duration_minutes: tier.duration_minutes,
          price: tier.price || tier.price_in_major_units || tier.price_in_minor_units || '',
          currency: tier.currency || pricing.currency || '',
          is_interval_pricing: tier.is_interval_pricing,
          interval_label: tier.interval_label
        }));
      } else if (pricing.duration && typeof pricing.duration === 'object') {
        // Fallback: extract all numeric keys as durations
        pricingTiers = Object.keys(pricing.duration)
          .filter(k => !isNaN(Number(k)) && typeof pricing.duration[k] === 'string')
          .map(k => ({
            duration_minutes: parseInt(k),
            price: pricing.duration[k],
            currency: pricing.currency || '',
            is_interval_pricing: false,
            interval_label: ''
          }));
      }
      let outputDuration = pricingTiers;
      if (
        pricing.duration &&
        typeof pricing.duration === 'object' &&
        !Array.isArray(pricing.duration) &&
        pricing.duration.interval_length_minutes
      ) {
        outputDuration = pricing.duration;
      }
      return {
        id: pricing.id || `justride-${idx}`,
        vehicle_type: pricing.vehicle_type || '',
        currency: pricing.currency || '',
        strategy: pricing.strategy || '',
        reservation_enabled: !!pricing.reservation_enabled,
        reservation_fee: pricing.reservation_fee,
        reservation_time_minutes: pricing.reservation_time_minutes,
        theft_insurance: pricing.theft_insurance || 0,
        theft_insurance_factor: pricing.theft_insurance_factor,
        theft_insurance_hour_price: pricing.theft_insurance_hour_price || 0,
        duration: outputDuration,
        additional_day: pricing.duration && pricing.duration.additional_day ? Number(pricing.duration.additional_day) : undefined
      };
    });
  } else if (justRideRaw && typeof justRideRaw === 'object') {
    // Fallback: single object
    justRide = [justRideRaw];
  } else {
    console.log(`  WARNING: No justRide found for ${city.city_name}`);
  }

  // DAY DEALS
  const dayDealsRaw = await safeFetch(city.day_deals_api_url, { 'accept': 'application/com.donkeyrepublic.v8', 'User-Agent': 'Mozilla/5.0 (compatible; DonkeyRepublic-PricingScript/1.0)' }, 'dayDeals');
  let dayDeals = [];
  if (dayDealsRaw && dayDealsRaw.accounts && Array.isArray(dayDealsRaw.accounts[0]?.pass_offers)) {
    dayDeals = dayDealsRaw.accounts[0].pass_offers.map((passOffer, idx) => ({
      id: passOffer.id || `deal-${idx}`,
      vehicle_type: passOffer.vehicle_type || '',
      duration: passOffer.duration || '',
      free_time: passOffer.free_time || {},
      price: passOffer.price || 0,
      currency: passOffer.currency || '',
      account_id: passOffer.account_id,
      tag: passOffer.tag || null,
      name: passOffer.name || null,
      auto_renewable: !!passOffer.auto_renewable,
      // For UI compatibility
      bike_type: passOffer.vehicle_type,
      duration_hours: passOffer.duration ? parseInt(passOffer.duration.replace(/\D/g, '')) / 60 : undefined,
      title: passOffer.vehicle_type && passOffer.vehicle_type.toLowerCase().includes('ebike') ? 'E-bike' : 'Pedal bike'
    }));
  } else {
    console.log(`  WARNING: No dayDeals found for ${city.city_name}`);
  }

  let warning = '';
  if (memberships.length === 0) warning += 'No memberships. ';
  if (justRide.length === 0) warning += 'No justRide. ';
  if (dayDeals.length === 0) warning += 'No dayDeals. ';
  return { memberships, justRide, dayDeals, ...(warning ? { warning: warning.trim() } : {}) };
}

(async () => {
  const allPricing = {};
  for (const city of cityData) {
    allPricing[city.city_name] = await fetchPricing(city);
    console.log(`Fetched pricing for ${city.city_name}`);
  }
  const outputPath = path.resolve(__dirname, '../public/pricing.json');
  fs.writeFileSync(outputPath, JSON.stringify(allPricing, null, 2));
  console.log(`Pricing data written to ${outputPath}`);
})();
