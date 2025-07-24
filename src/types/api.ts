export interface ApiCity {
  city_name: string;
  city_app_id: number;
  memberships_api_url: string;
  day_deals_api_url: string;
  just_ride_api_url: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  short_description?: string;
  popular?: boolean;
}

export interface BikeType {
  id: string;
  name: string;
  type: 'pbike' | 'ebike';
}

export interface PricingTier {
  duration_minutes: number;
  price: number;
  currency: string;
  is_interval_pricing?: boolean;
  interval_label?: string;
}

export interface DayDeal {
  id: string;
  vehicle_type: string;
  duration: string;
  free_time: Record<string, string>;
  price: number;
  currency: string;
  account_id: number;
  tag: string | null;
  name: string | null;
  auto_renewable: boolean;
  // For compatibility with UI
  bike_type?: string;
  duration_hours?: number;
  title?: string;
}

export interface IntervalPricing {
  interval_length_minutes: string;
  normalization_period_mins: string;
  starting_fee_in_major_units: string;
  starting_fee_duration_minutes: string;
  cost_per_interval_in_major_units: string;
  max_price_per_normalization_period_in_major_units: string;
}

export interface JustRidePricing {
  id: string;
  vehicle_type: string;
  currency: string;
  strategy: string;
  reservation_enabled: boolean;
  reservation_fee?: number;
  reservation_time_minutes?: number;
  theft_insurance: number;
  theft_insurance_factor?: number;
  theft_insurance_hour_price: number;
  duration: PricingTier[] | IntervalPricing;
  additional_day?: number;
}

export interface CityPricingData {
  city_name: string;
  memberships: MembershipPlan[];
  dayDeals: DayDeal[];
  justRide: JustRidePricing[];
  loading: boolean;
  error?: string;
}