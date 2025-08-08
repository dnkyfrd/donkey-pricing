import React, { useState, useEffect } from 'react';
import { ChevronDown, MapPin, Star, Zap, Bike, AlertCircle } from 'lucide-react';
import { groupedCities } from './data/cities';
// import { fetchCityPricing } from './services/api';
import { CityPricingData, MembershipPlan } from './types/api';
import { LoadingSpinner } from './components/LoadingSpinner';

function App() {
  const [selectedCountry, setSelectedCountry] = useState('Denmark');
  const [selectedCity, setSelectedCity] = useState('Copenhagen');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [pricingData, setPricingData] = useState<CityPricingData | null>(null);
  const [allPricing, setAllPricing] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // No geolocation: default selection only

  type VehicleType = 'bike' | 'ebike' | 'cargo' | 'ecargo';

  const vehicleLabels: Record<VehicleType, string> = {
    bike: 'Classic Bike',
    ebike: 'Electric Bike',
    cargo: 'Cargo Bike',
    ecargo: 'E-Cargo Bike',
  };

  const order: Record<string, number> = {
    'Pedal bike': 0,
    'E-bike': 1,
    'Cargo bike': 2,
    'E-Cargo bike': 3,
  };

  useEffect(() => {
    let lastHeight = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const sendHeight = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const wrapper = document.getElementById('content-wrapper');
          const height = wrapper?.offsetHeight || document.documentElement.scrollHeight;        
          if (height === lastHeight) return;
          lastHeight = height;        
          window.parent.postMessage({ type: 'resize', height }, '*');
        }, 100);
      });
    };
  
    const debouncedSend = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(sendHeight, 100);
    };
  
    setTimeout(sendHeight, 300); // initial render
  
    const resizeObserver = new ResizeObserver(debouncedSend);
    resizeObserver.observe(document.body);
    window.addEventListener('resize', debouncedSend);
  
    // ✅ Listen for messages from parent
    const handleMessage = (event: MessageEvent) => {      
      if (event.data?.type === 'getHeight') {        
        sendHeight(); // respond with updated height
      }
    };
    window.addEventListener('message', handleMessage);
  
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', debouncedSend);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const countries = Object.keys(groupedCities);
  const cities = React.useMemo(() => selectedCountry ? groupedCities[selectedCountry] || [] : [], [selectedCountry]);

  useEffect(() => {
    if (selectedCountry && cities.length > 0 && !cities.find(city => city.city_name === selectedCity)) {
      setSelectedCity(cities[0].city_name);
    }
  }, [selectedCountry, cities, selectedCity]);

  // Load all pricing data from /pricing.json on first mount
  useEffect(() => {
    setLoading(true);
    fetch('/pricing.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch pricing.json');
        return res.json();
      })
      .then(json => {
        setAllPricing(json);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load pricing data. Please try again.');
        setLoading(false);
      });
  }, []);

  // Update city pricing when selection changes
  useEffect(() => {
    if (allPricing && selectedCity) {
      const cityPricing = allPricing[selectedCity];
      if (cityPricing) {
        setPricingData({
          city_name: selectedCity,
          memberships: cityPricing.memberships || [],
          dayDeals: cityPricing.dayDeals || [],
          justRide: cityPricing.justRide || [],
          loading: false
        });
        setError(null);
      } else {
        setPricingData(null);
        setError('No pricing data found for this city.');
      }
    }
  }, [allPricing, selectedCity]);


  // Always round up to nearest integer for Just Ride pricing
  const formatPrice = (price: number, currency: string = 'EUR') => `${Math.ceil(Number(price))} ${currency}`;

  function getFreeTimeLabel(value: string | undefined): string {
    if (!value || typeof value !== 'string') return '';
    const seconds = parseInt(value.replace('PT', '').replace('S', ''), 10);
    const hours = seconds / 3600;    
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  const getDurationLabel = (minutes: number) => {
  if (minutes >= 60) {
    const hours = minutes / 60;
    if (hours % 168 === 0) {
      const weeks = hours / 168;
      return weeks === 1 ? '1 week' : `${weeks} weeks`;
    }
    if (hours % 24 === 0) {
      const days = hours / 24;
      return days === 1 ? '1 day' : `${days} days`;
    }
    return hours === 1 ? '1h' : `${hours}h`;
  }
  return `${minutes}min`;
};

  const getBikeTypeIcon = (bikeType: string) => {
  const type = bikeType.toLowerCase().replace(/\s/g, '');
  return (type === 'ebike' || type === 'electric') ? Zap : Bike;
};

  // Type guard for interval-based pricing
  function isIntervalPricing(duration: any): duration is import('./types/api').IntervalPricing {
    return (
      duration &&
      typeof duration === 'object' &&
      !Array.isArray(duration) &&
      typeof duration.interval_length_minutes !== 'undefined' &&
      typeof duration.starting_fee_in_major_units !== 'undefined'
    );
  }

  // Helper function to chunk memberships into rows of 3
  const chunkMemberships = (memberships: MembershipPlan[], size: number) => {
    const chunks = [];
    for (let i = 0; i < memberships.length; i += size) {
      chunks.push(memberships.slice(i, i + size));
    }
    return chunks;
  };

  return (
    <div id="content-wrapper" className="w-full">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
        {/* Location Selector */}
        <section className="pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6">
              <div className="flex items-center justify-center space-x-1 mb-6">
                <MapPin className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-slate-900">Select Your Location</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Country Selector */}
                <div className="relative">
                  <button
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-slate-900 font-medium">{selectedCountry}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {countryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                      {countries.map((country) => (
                        <button
                          key={country}
                          onClick={() => {
                            setSelectedCountry(country);
                            setCountryDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl transition-colors"
                        >
                          {country}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* City Selector */}
                <div className="relative">
                  <button
                    onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-slate-900 font-medium">{selectedCity}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {cityDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                      {cities.map((city) => (
                        <button
                          key={city.city_name}
                          onClick={() => {
                            setSelectedCity(city.city_name);
                            setCityDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl transition-colors"
                        >
                          {city.city_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <section className="pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-12 text-center">
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <p className="text-slate-600">Loading pricing data...</p>
              </div>
            </div>
          </section>
        )}

        {/* Error State */}
        {error && (
          <section className="pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-2xl shadow-lg border border-red-200/50 p-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors cursor-not-allowed opacity-60"
                  disabled
                >
                  Try Again
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Just Ride Pricing */}
        {pricingData && pricingData.justRide.length > 0 && (
          <section className="pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Just Ride</h2>
                <p className="text-slate-600">Perfect for short rides</p>
              </div>

              {/* Side-by-side bike/ebike */}
              <div className={`grid gap-6 ${pricingData.justRide.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {[...pricingData.justRide]
                .sort((a, b) => {
                  return (order[a.vehicle_type] ?? 99) - (order[b.vehicle_type] ?? 99);
                })
                  .map((pricing) => (
                  <div key={pricing.id} className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 flex flex-col">
                    <div className="flex items-center justify-center mb-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${pricing.vehicle_type.toLowerCase().includes('e') ? 'from-orange-100 to-orange-200' : 'from-blue-100 to-blue-200'} rounded-xl flex items-center justify-center mr-3`}>
                        {(() => {
    const Icon = getBikeTypeIcon(pricing.vehicle_type);
    return <Icon className={`w-5 h-5 ${pricing.vehicle_type.toLowerCase().includes('e') ? 'text-orange-600' : 'text-blue-600'}`} />;
  })()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900"> {vehicleLabels[pricing.vehicle_type as VehicleType] || 'Unknown Bike'}</h3>
                      </div>
                    </div>
                    {/* Pricing Tiers */}
                    {/* Interval-based (Copenhagen-style) pricing support */}
                    {isIntervalPricing(pricing.duration) ? (
                      <div className="rounded-lg p-4 text-center">
                        {Number(pricing.duration.starting_fee_in_major_units) !== Number(pricing.duration.cost_per_interval_in_major_units) && (
                          <div className="text-base font-bold text-slate-900 mb-1">
                            {`${formatPrice(Number(pricing.duration.starting_fee_in_major_units), pricing.currency)} for first ${Number(pricing.duration.starting_fee_duration_minutes)} minutes`}
                          </div>
                        )}
                        <div className="text-base font-bold text-slate-900 mb-1">
                          {`${formatPrice(Number(pricing.duration.cost_per_interval_in_major_units), pricing.currency)} every ${Number(pricing.duration.interval_length_minutes)} minutes`}
                        </div>                     
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4">
                        {Array.isArray(pricing.duration) && pricing.duration.map((tier, tierIndex) => {
                          // Interval pricing: e.g. 12 DKK every 15 minutes
                          if (tier.is_interval_pricing && tier.interval_label) {
                            return (
                              <div
                                key={tierIndex}
                                className="bg-slate-50 rounded-lg p-3 text-center hover:bg-blue-50 hover:border-blue-200 border-2 border-transparent transition-all"
                              >
                                <div className="text-base font-bold text-slate-900">
                                  {`${formatPrice(tier.price, tier.currency)} ${tier.interval_label}`}
                                </div>
                              </div>
                            );
                          }
                          // Otherwise, show as days/weeks/minutes
                          let label = '';
                          if (tier.duration_minutes >= 10080) {
                            const weeks = Math.round(tier.duration_minutes / 10080);
                            label = weeks === 1 ? '1 week' : `${weeks} weeks`;
                          } else if (tier.duration_minutes >= 1440) {
                            const days = Math.round(tier.duration_minutes / 1440);
                            label = days === 1 ? '1 day' : `${days} days`;
                          } else {
                            label = getDurationLabel(tier.duration_minutes);
                          }
                          return (
                            <div
                              key={tierIndex}
                              className="bg-slate-50 rounded-lg p-3 text-center hover:bg-blue-50 hover:border-blue-200 border-2 border-transparent transition-all"
                            >
                              <div className="text-sm font-medium text-slate-600 mb-1">
                                {label}
                              </div>
                              <div className="text-base font-bold text-slate-900">
                                {formatPrice(tier.price, tier.currency)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Additional Day Price */}
                    {pricing.additional_day && (
                      <div className="mt-2 text-center">
                        <span className="text-sm text-slate-600">Additional day:</span> <span className="font-bold text-slate-900">{formatPrice(pricing.additional_day, pricing.currency)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Memberships */}
              {pricingData && pricingData.memberships.length > 0 && (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Memberships</h2>
                    <p className="text-slate-600">Save more with our membership plans</p>
                    <button
                        className="w-80 mt-5 px-3 py-2 rounded-lg text-sm font-semibold transition-all bg-slate-800 text-white hover:bg-slate-700"
                        style={{ backgroundColor: '#ff6400' }}
                        onClick={() => window.open('https://dnky.bike/7jIsFIUKoHb', '_blank', 'noopener,noreferrer')}
                      >
                        Get Started
                      </button>
                  </div>

                  <div className="space-y-4">
                    {chunkMemberships(pricingData.memberships, 3).map((membershipRow) => (
                      <div className="grid grid-cols-3 gap-3">
                        {membershipRow.map((membership) => (
                          <div
                            key={membership.id}
                            className={`relative bg-white rounded-xl border-2 p-4 text-center transition-all hover:shadow-lg ${
                              membership.popular 
                                ? 'border-orange-500 shadow-md' 
                                : 'border-slate-200/50 hover:border-orange-200'
                            }`}
                          >
                            {membership.popular && (
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                                  <Star className="w-3 h-3" />
                                  <span>Popular</span>
                                </span>
                              </div>
                            )}
                            
                            <h3 className="text-base font-bold text-slate-900 mb-2">{membership.name}</h3>
                            {membership.short_description && (
                              <p className="text-xs text-slate-600 mb-3">{membership.short_description}</p>
                            )}
                            <div className="mb-3">
                              <span className="text-xl font-bold text-slate-900">{formatPrice(membership.price, membership.currency)}</span>
                              <div className="text-xs text-slate-600">/{membership.period}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Day Passes */}
              {pricingData && (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Passes</h2>
                    <p className="text-slate-600">Perfect for day trip or weekend adventures.</p>

                    {pricingData.dayDeals.length > 0 ? (
                    <button
                        className="w-80 mt-5 px-3 py-2 rounded-lg text-sm font-semibold transition-all bg-slate-800 text-white hover:bg-slate-700"
                        style={{ backgroundColor: '#ff6400' }}
                        onClick={() => window.open('https://dnky.bike/7jIsFIUKoHb', '_blank', 'noopener,noreferrer')}
                      >
                        Get started
                      </button>
                    ) : ''}
                  </div>
                  {pricingData.dayDeals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...pricingData.dayDeals]
    .sort((a, b) => {
      // Pedal bike (bike) first, then E-bike
      if ((a.title === 'Pedal bike' && b.title === 'E-bike')) return -1;
      if ((a.title === 'E-bike' && b.title === 'Pedal bike')) return 1;
      return 0;
    })
    .map((dayDeal) => {
                        const Icon = getBikeTypeIcon(dayDeal.bike_type ?? '');
                        const isEBike = (dayDeal.bike_type ?? '').toLowerCase() === 'ebike';
                        return (
                          <div key={dayDeal.id} className="bg-white rounded-xl border border-slate-200/50 p-6 flex flex-col items-center hover:shadow-lg hover:border-orange-200 transition-all">
    {/* Row 1: Icon and bike type label */}
    <div className={`w-12 h-12 mb-3 bg-gradient-to-br ${isEBike ? 'from-orange-100 to-orange-200' : 'from-blue-100 to-blue-200'} rounded-xl flex items-center justify-center`}>
      <Icon className={`w-6 h-6 ${isEBike ? 'text-orange-600' : 'text-blue-600'}`} />
    </div>
    <h3 className="text-base font-bold text-slate-900 mb-2 text-center">{dayDeal.vehicle_type === 'bike' ? 'Classic Bike' : 'Electric Bike'}</h3>

    {/* Row 2: Price */}
    <div className="text-xl font-bold text-slate-900 mb-1 text-center">{formatPrice(dayDeal.price, dayDeal.currency)}</div>

    {/* Row 3: Duration */}
    <div className="text-sm text-slate-600 mb-2 mt-3 text-center">
    {dayDeal.free_time?.[isEBike ? 'ebike' : 'bike']
      ? `${getFreeTimeLabel(dayDeal.free_time[isEBike ? 'ebike' : 'bike'])} of riding time`
      : ''}
  </div>
    <div className="text-sm text-slate-600 mb-4 text-center">Valid for {getDurationLabel((dayDeal.duration_hours ?? 0) * 60)}</div>


  </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200/50 p-8 text-center flex flex-col items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-slate-400 mb-2" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No Passes Available</h3>
                      <p className="text-slate-600">There are currently no passes offered for {selectedCity}.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* No Data Message */}
        {pricingData && pricingData.memberships.length === 0 && pricingData.dayDeals.length === 0 && pricingData.justRide.length === 0 && (
          <section className="pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Pricing Data Available</h3>
                <p className="text-slate-600">Pricing information is not currently available for {selectedCity}.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
