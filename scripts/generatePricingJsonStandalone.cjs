// Standalone Node.js script to fetch pricing for all cities and write to public/pricing.json
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
global.fetch = fetch;

// City list is sourced from src/data/cities.json (single source of truth, shared with the app)
const rawCities = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/data/cities.json'), 'utf8'));
const cityData = rawCities.map((c) => {
  const loc = `${c.lat},${c.lon}`;
  return {
    city_name: c.name,
    city_app_id: c.city_app_id,
    memberships_api_url: `https://stables.donkey.bike/api/public/plans?location=${loc}&country_code=${c.country}`,
    just_ride_api_url: `https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=${loc}`,
    day_deals_api_url: `https://stables.donkey.bike/api/public/nearby?location=${loc}&filter_type=radius&radius=${c.radius}`,
  };
});

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
  const _debug3571 = Array.isArray(membershipsRaw) ? membershipsRaw.find(p => p.id === 3571) : (membershipsRaw?.plans || []).find(p => p.id === 3571);
  if (_debug3571) console.log('[DEBUG] membership 3571:', JSON.stringify(_debug3571, null, 2));
  const _debug3230 = Array.isArray(membershipsRaw) ? membershipsRaw.find(p => p.id === 3230) : (membershipsRaw?.plans || []).find(p => p.id === 3230);
  if (_debug3230) console.log('[DEBUG] membership 3230 raw:', JSON.stringify(_debug3230, null, 2));
  let memberships = [];
  function mapPlan(plan, idx) {
    const monthlyPrice = parseFloat(plan.price) || 0;
    const yearlyOptions = Array.isArray(plan.payment_options)
      ? plan.payment_options.filter(o => o.payment_option_type === 'yearly_discount' && o.yearly_discount)
      : [];
    const bestDiscount = yearlyOptions.reduce((max, o) => Math.max(max, parseFloat(o.yearly_discount)), 0);
    const yearlyPrice = bestDiscount > 0
      ? Math.round(monthlyPrice * 12 * (1 - bestDiscount / 100))
      : undefined;
    const planItems = Array.isArray(plan.plan_items) && plan.plan_items.length > 0
      ? plan.plan_items.map(item => ({
          vehicle_type: item.vehicle_type || '',
          time_limit: item.time_limit || null,
          custom_price: item.custom_price ? parseFloat(item.custom_price) : null,
          custom_step: item.custom_step || null,
        }))
      : undefined;
    return {
      id: plan.id || `plan-${idx}`,
      name: plan.name || plan.title || 'Plan',
      price: monthlyPrice,
      currency: plan.currency || '',
      period: plan.interval || 'month',
      short_description: plan.short_description || plan.description || '',
      popular: !!plan.featured,
      ...(planItems !== undefined && { plan_items: planItems }),
      ...(yearlyPrice !== undefined && { yearly_price: yearlyPrice }),
    };
  }

  if (Array.isArray(membershipsRaw)) {
    memberships = membershipsRaw.map(mapPlan);
  } else if (membershipsRaw && Array.isArray(membershipsRaw.plans)) {
    memberships = membershipsRaw.plans.map(mapPlan);
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
