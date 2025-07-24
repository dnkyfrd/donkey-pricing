import { ApiCity, MembershipPlan, DayDeal, JustRidePricing } from '../types/api';

const API_HEADERS_V8 = {
  'accept': 'application/com.donkeyrepublic.v8',
  'Content-Type': 'application/json'
};

const API_HEADERS_V4 = {
  'accept': 'application/com.donkeyrepublic.v4',
  'Content-Type': 'application/json'
};

// Helper to get the right fetch implementation (node-fetch in Node, global fetch in browser)
async function getFetch(): Promise<typeof fetch> {
  if (typeof window === 'undefined') {
    // Node.js (ESM)
    const mod = await import('node-fetch');
    return mod.default;
  }
  // Browser
  return fetch;
}

// Helper function to get the proxied URL for development
function getProxiedUrl(originalUrl: string): string {
  if (typeof window !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    // In development, use the proxy
    return originalUrl.replace('https://stables.donkey.bike', '/api-proxy');
  }
  // In production, use the original URL
  return originalUrl;
}

export async function fetchMemberships(city: ApiCity): Promise<MembershipPlan[]> {
  try {
    const fetchImpl = await getFetch();
    const response = await fetchImpl(getProxiedUrl(city.memberships_api_url), {
      method: 'GET',
      headers: API_HEADERS_V8
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch memberships: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log the full response to understand the structure
    console.log('Memberships API Response:', JSON.stringify(data, null, 2));
    
    // Transform API response to our format
    const memberships: MembershipPlan[] = [];
    if (Array.isArray(data)) {
      data.forEach((plan: { id?: string; name?: string; title?: string; price?: number | string; currency?: string; interval?: string; short_description?: string; description?: string; featured?: boolean }) => {
        if (plan.price && plan.currency) {
          let displayPrice = Number(plan.price);
          const yearlyDiscount = (plan as any).yearly_discount;
          if (yearlyDiscount && !isNaN(Number(yearlyDiscount))) {
            displayPrice = Number(yearlyDiscount);
          }
          memberships.push({
            id: plan.id || `plan-${memberships.length}`,
            name: plan.name || plan.title || 'Plan',
            price: Math.round(displayPrice),
            currency: plan.currency,
            period: plan.interval || 'month',
            short_description: plan.short_description || plan.description || '',
            popular: plan.featured || false
          });
        }
      });
    }
    
    return memberships;
  } catch (error) {
    console.error('Error fetching memberships:', error);
    return [];
  }
}

export async function fetchDayDeals(city: ApiCity): Promise<DayDeal[]> {
  try {
    const fetchImpl = await getFetch();
    const response = await fetchImpl(getProxiedUrl(city.day_deals_api_url), {
      method: 'GET',
      headers: API_HEADERS_V8
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch day deals: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log the full response to understand the structure
    console.log('Day Deals API Response:', JSON.stringify(data.accounts, null, 2));
    
    const dayDeals: DayDeal[] = [];
    if (Array.isArray(data.accounts[0].pass_offers)) {
      data.accounts[0].pass_offers.forEach((passOffer: any) => {
        if (
          passOffer.id !== undefined &&
          passOffer.vehicle_type &&
          passOffer.duration &&
          passOffer.free_time &&
          passOffer.price !== undefined &&
          passOffer.currency &&
          passOffer.account_id !== undefined &&
          'auto_renewable' in passOffer
        ) {
          dayDeals.push({
            id: String(passOffer.id),
            vehicle_type: passOffer.vehicle_type,
            duration: passOffer.duration,
            free_time: passOffer.free_time,
            price: typeof passOffer.price === 'string' ? parseFloat(passOffer.price) : passOffer.price,
            currency: passOffer.currency,
            account_id: passOffer.account_id,
            tag: passOffer.tag ?? null,
            name: passOffer.name ?? null,
            auto_renewable: Boolean(passOffer.auto_renewable),
            // For UI compatibility
            bike_type: passOffer.vehicle_type,
            duration_hours: parseInt(passOffer.duration.replace(/\D/g, '')) / 60,
            title:
              passOffer.vehicle_type &&
              passOffer.vehicle_type.toLowerCase().includes('ebike')
                ? 'E-bike'
                : 'Pedal bike'
          });
        }
      });
    }
    return dayDeals;
  } catch (error) {
    console.error('Error fetching day deals:', error);
    return [];
  }
}


export async function fetchJustRidePricing(city: ApiCity): Promise<JustRidePricing[]> {
  try {
    const fetchImpl = await getFetch();
    const response = await fetchImpl(getProxiedUrl(city.just_ride_api_url), {
      method: 'GET',
      headers: API_HEADERS_V4
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch just ride pricing: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log the full response to understand the structure
    console.log('Just Ride API Response:', JSON.stringify(data, null, 2));
    
    const justRidePricing: JustRidePricing[] = [];
    
    if (Array.isArray(data)) {
      data.forEach((pricing: any) => {
        // Special case: interval pricing (e.g. 12 DKK every 15 minutes)
        if (
          pricing.duration &&
          typeof pricing.duration === 'object' &&
          pricing.duration.interval_length_minutes &&
          pricing.duration.starting_fee_in_major_units
        ) {
          justRidePricing.push({
            id: pricing.id || `pricing-${justRidePricing.length}`,
            vehicle_type: pricing.vehicle_type || 'bike',
            currency: pricing.currency || 'EUR',
            strategy: pricing.strategy || 'interval_pricing',
            reservation_enabled: pricing.reservation_enabled || false,
            reservation_fee: pricing.reservation_fee,
            reservation_time_minutes: pricing.reservation_time_minutes,
            theft_insurance: pricing.theft_insurance || 0,
            theft_insurance_factor: pricing.theft_insurance_factor,
            theft_insurance_hour_price: pricing.theft_insurance_hour_price || 0,
            duration: [{
              duration_minutes: Number(pricing.duration.interval_length_minutes),
              price: Number(pricing.duration.starting_fee_in_major_units),
              currency: pricing.currency || 'EUR',
              is_interval_pricing: true,
              interval_label: `every ${Number(pricing.duration.interval_length_minutes)} minutes`
            }],
            additional_day: undefined
          });
        } else if (pricing.duration && typeof pricing.duration === 'object' && !Array.isArray(pricing.duration)) {
          const pricingTiers = Object.entries(pricing.duration)
            .filter(([minutes, price]) => minutes !== 'additional_day' && !isNaN(Number(minutes)) && !isNaN(Number(price)))
            .map(([minutes, price]) => ({
              duration_minutes: Number(minutes),
              price: Number(price),
              currency: pricing.currency || 'EUR'
            }))
            .sort((a, b) => a.duration_minutes - b.duration_minutes);

          if (pricingTiers.length > 0) {
            justRidePricing.push({
              id: pricing.id || `pricing-${justRidePricing.length}`,
              vehicle_type: pricing.vehicle_type || 'bike',
              currency: pricing.currency || 'EUR',
              strategy: pricing.strategy || 'per_tier_billing',
              reservation_enabled: pricing.reservation_enabled || false,
              reservation_fee: pricing.reservation_fee,
              reservation_time_minutes: pricing.reservation_time_minutes,
              theft_insurance: pricing.theft_insurance || 0,
              theft_insurance_factor: pricing.theft_insurance_factor,
              theft_insurance_hour_price: pricing.theft_insurance_hour_price || 0,
              duration: pricingTiers,
              additional_day: pricing.duration.additional_day ? Number(pricing.duration.additional_day) : undefined
            });
          }
        }
      });
    }

    return justRidePricing;
  } catch (error) {
    console.error('Error fetching just ride pricing:', error);
    return [];
  }
}

export async function fetchCityPricing(city: ApiCity) {
  const [memberships, dayDeals, justRide] = await Promise.all([
    fetchMemberships(city),
    fetchDayDeals(city),
    fetchJustRidePricing(city)
  ]);
  
  return {
    memberships,
    dayDeals,
    justRide
  };
}