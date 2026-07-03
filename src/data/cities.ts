import { ApiCity } from '../types/api';
import rawCities from './cities.json';

interface RawCity {
  name: string;
  city_app_id: number;
  country: string;
  lat: number;
  lon: number;
  radius: number;
}

const COUNTRY_NAMES: Record<string, string> = {
  DK: 'Denmark',
  NL: 'Netherlands',
  BE: 'Belgium',
  ES: 'Spain',
  DE: 'Germany',
  FI: 'Finland',
  CH: 'Switzerland',
  SE: 'Sweden',
};

function buildCity(raw: RawCity): ApiCity {
  const loc = `${raw.lat},${raw.lon}`;
  return {
    city_name: raw.name,
    city_app_id: raw.city_app_id,
    memberships_api_url: `https://stables.donkey.bike/api/public/plans?location=${loc}&country_code=${raw.country}`,
    just_ride_api_url: `https://stables.donkey.bike/api/public/pricings?pricing_type=location&location=${loc}`,
    day_deals_api_url: `https://stables.donkey.bike/api/public/nearby?location=${loc}&filter_type=radius&radius=${raw.radius}`,
  };
}

export const cityData: ApiCity[] = (rawCities as RawCity[]).map(buildCity);

export const groupedCities = (rawCities as RawCity[]).reduce((acc, raw) => {
  const country = COUNTRY_NAMES[raw.country] || 'Unknown';
  if (!acc[country]) acc[country] = [];
  acc[country].push(buildCity(raw));
  return acc;
}, {} as Record<string, ApiCity[]>);
