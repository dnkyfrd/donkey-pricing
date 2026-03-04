import React, { useState, useEffect } from 'react';
import { ChevronDown, MapPin, Star, Zap, Bike, AlertCircle } from 'lucide-react';
import { groupedCities } from './data/cities';
// import { fetchCityPricing } from './services/api';
import { CityPricingData, MembershipPlan } from './types/api';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useTranslation } from './hooks/useTranslation';

function App() {
  const params = new URLSearchParams(window.location.search);
  const locale = params.get('locale') || 'en';
  const { t } = useTranslation(locale);
  
  const [selectedCountry, setSelectedCountry] = useState(t('select_country'));
  const [selectedCity, setSelectedCity] = useState(t('select_city'));
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [pricingData, setPricingData] = useState<CityPricingData | null>(null);
  const [allPricing, setAllPricing] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if app is running on metropolradruhr.de
  const isMetropolRadRuhr = new URLSearchParams(window.location.search).get('domain') === 'metropolradruhr';

  // Set default values for metropolradruhr.de
  useEffect(() => {
    if (isMetropolRadRuhr) {
      setSelectedCountry('Germany');
      setSelectedCity('Ruhr Region');
    }
  }, [isMetropolRadRuhr]);  

useEffect(() => {
  const loadGeo = async () => {
    try {
      const res = await fetch("/geo");
      const { countryName } = await res.json();

      if (!countryName) return;

      const matchedCountry = findMatchingCountry(
        countryName,
        groupedCities
      );

      if (matchedCountry && !isMetropolRadRuhr) {
        console.log(matchedCountry)
        setSelectedCountry(matchedCountry);
      }
    } catch (err) {
      console.warn("Geo lookup failed", err);
    }
  };

  loadGeo();
}, []);

useEffect(() => {
  const handleClick = (e: MouseEvent) => {
    if (
      !(e.target as HTMLElement).closest("#country-dropdown") &&
      !(e.target as HTMLElement).closest("#city-dropdown")
    ) {
      setCountryDropdownOpen(false);
      setCityDropdownOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, []);

  function normalizeCountry(name: string) {
  return name
    .toLowerCase()
    .replace(/^the\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findMatchingCountry(
  geoCountry: string,
  countries: Record<string, unknown>
) {
  const normalizedGeo = normalizeCountry(geoCountry);

  return Object.keys(countries).find(
    (country) => normalizeCountry(country) === normalizedGeo
  );
}

  type VehicleType = 'bike' | 'ebike' | 'cargo' | 'ecargo';

  const vehicleLabels: Record<VehicleType, string> = {
    bike: t('classic_bike'),
    ebike: t('electric_bike'),
    cargo: t('cargo_bike'),
    ecargo: t('ecargo_bike'),
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
      switch(selectedCountry) {
        case 'Denmark':
          setSelectedCity('Copenhagen');
          break;
        case 'Netherlands':
          setSelectedCity('Amsterdam');
          break;
        case 'Switzerland':
          setSelectedCity('Geneva');
          break;
        case 'Belgium':
          setSelectedCity('Antwerp');
          break;
        case 'Germany':
          setSelectedCity('Hanover');
          break;
        default:
          setSelectedCity(cities[0].city_name);
      }
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
        setError('Select a Donkey country and city above to view pricing');
      }
    }
  }, [allPricing, selectedCity]);


  // Always round up to nearest integer for Just Ride pricing
  const formatPrice = (price: number, currency: string = 'EUR') => `${Number(price)} ${currency}`;

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
      <div className="py-8">
        {/* Location Selector */}
        {!isMetropolRadRuhr && (
        <section className="pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg border border-2 border-orange-500/60 p-6">
              <div className="flex items-center justify-center space-x-1 mb-6">
                <MapPin className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-slate-900">{t('select_location')}</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Country Selector */}
                <div id="country-dropdown" className="relative">
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
                <div id="city-dropdown" className="relative">
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
        )}

        {/* Loading State */}
        {loading && (
          <section className="pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-12 text-center">
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <p className="text-slate-600">{t('loading_pricing')}</p>
              </div>
            </div>
          </section>
        )}

        {/* Error State */}
        {error && (
          <section className="pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-2xl shadow-lg border border-200/50 p-12 text-center">
                <MapPin className="w-12 h-12 text-500 mx-auto mb-4" />
                <p className="text-600 mb-4">{error}</p>           
              </div>
            </div>
          </section>
        )}

        {/* Just Ride Pricing */}
        {pricingData && pricingData.justRide.length > 0 && (
          <section className="pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('just_ride')}</h2>
                <p className="text-slate-600">{t('perfect_for_short_rides')}</p>
              </div>

              {/* Side-by-side bike/ebike */}
              <div className={`grid gap-6 ${pricingData.justRide.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {[...pricingData.justRide]
                .sort((a, b) => {
                  // Map of vehicle types to their sort order
                  console.log(a, b);
                  const typeOrder: Record<string, number> = {
                    'bike': 0,
                    'ebike': 1,
                    'cargo': 2,
                    'ecargo': 3,
                    // Add any other possible variations here
                    'Pedal Bike': 0,
                    'pedal bike': 0,
                    'e-bike': 1,
                    'E-Bike': 1,
                  };
                  
                  const orderA = typeOrder[a.vehicle_type] ?? 99;
                  const orderB = typeOrder[b.vehicle_type] ?? 99;
                  
                  return orderA - orderB;
                })
                  .map((pricing) => (
                  <div key={pricing.id} className="bg-gradient-to-br from-orange-50/30 via-white to-blue-50/30 rounded-2xl shadow-xl border-2 border-orange-200/50 p-6 flex flex-col hover:shadow-2xl hover:border-orange-400 hover:bg-gradient-to-br hover:from-orange-100/40 hover:via-white hover:to-blue-100/40 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-200/30 to-blue-200/30 rounded-full -mr-10 -mt-10"></div>
                    <div className="flex items-center justify-center mb-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${pricing.vehicle_type.toLowerCase().includes('e') ? 'from-orange-100 to-orange-200' : 'from-blue-100 to-blue-200'} rounded-xl flex items-center justify-center mr-3`}>
                        {(() => {
    const Icon = getBikeTypeIcon(pricing.vehicle_type);
    return <Icon className={`w-5 h-5 ${pricing.vehicle_type.toLowerCase().includes('e') ? 'text-orange-600' : 'text-blue-600'}`} />;
  })()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900"> {vehicleLabels[pricing.vehicle_type as VehicleType] || t('unknown_bike')}</h3>
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
                                className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-3 text-center hover:bg-gradient-to-br hover:from-blue-50 hover:to-orange-50 hover:border-blue-300 border-2 border-transparent transition-all duration-300 hover:shadow-md"
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
                              className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-3 text-center hover:bg-gradient-to-br hover:from-blue-50 hover:to-orange-50 hover:border-blue-300 border-2 border-transparent transition-all duration-300 hover:shadow-md"
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
                        <span className="text-sm text-slate-600">{t('additional_day')}</span> <span className="font-bold text-slate-900">{formatPrice(pricing.additional_day, pricing.currency)}</span>
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
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('memberships')}</h2>
                    <p className="text-slate-600">{t('save_more')}</p>
                    <button
                        className="w-80 mt-5 px-3 py-2 rounded-lg text-sm font-semibold transition-all bg-slate-800 text-white hover:bg-slate-700"
                        style={{ backgroundColor: '#ff6400' }}
                        onClick={() => window.open('https://dnky.bike/7jIsFIUKoHb', '_blank', 'noopener,noreferrer')}
                      >
                        {t('get_started')}
                      </button>
                  </div>

                  <div className="space-y-4">
                    {chunkMemberships(pricingData.memberships, 3).map((membershipRow) => (
                      <div className={`grid gap-3 ${
                        membershipRow.length === 1 
                          ? 'grid-cols-1 justify-center' 
                          : membershipRow.length === 2 
                            ? 'grid-cols-2 max-w-2xl mx-auto' 
                            : 'grid-cols-3'
                      }`}>
                        {membershipRow.map((membership) => (
                          <div
                            key={membership.id}
                            className={`relative bg-gradient-to-br from-orange-50/20 via-white to-blue-50/20 rounded-xl border-2 p-4 text-center transition-all hover:shadow-xl hover:scale-105 overflow-hidden ${
                              membership.popular 
                                ? 'border-orange-400 shadow-lg bg-gradient-to-br from-orange-100/50 via-orange-50/30 to-white ring-2 ring-orange-300/50' 
                                : 'border-orange-200/60 hover:border-orange-400 hover:bg-gradient-to-br hover:from-orange-100/30 hover:via-white hover:to-blue-100/30'
                            }`}
                          >
                            {membership.popular && (
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                                  <Star className="w-3 h-3" />
                                  <span>{t('popular')}</span>
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
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('passes')}</h2>
                    <p className="text-slate-600">{t('perfect_for_day_trips')}</p>

                    {pricingData.dayDeals.length > 0 ? (
                    <button
                        className="w-80 mt-5 px-3 py-2 rounded-lg text-sm font-semibold transition-all bg-slate-800 text-white hover:bg-slate-700"
                        style={{ backgroundColor: '#ff6400' }}
                        onClick={() => window.open('https://dnky.bike/7jIsFIUKoHb', '_blank', 'noopener,noreferrer')}
                      >
                        {t('get_started_alt')}
                      </button>
                    ) : ''}
                  </div>
                  {pricingData.dayDeals.length > 0 ? (
                    <div className={`grid gap-4 ${
                      pricingData.dayDeals.length === 1 
                        ? 'grid-cols-1 justify-center max-w-md mx-auto' 
                        : 'grid-cols-1 md:grid-cols-2'
                    }`}>
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
                          <div key={dayDeal.id} className="bg-gradient-to-br from-orange-50/30 via-white to-blue-50/30 rounded-xl border-2 border-orange-200/50 p-6 flex flex-col items-center hover:shadow-xl hover:border-orange-400 hover:bg-gradient-to-br hover:from-orange-100/40 hover:via-white hover:to-blue-100/40 hover:scale-105 transition-all duration-300 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-200/30 to-blue-200/30 rounded-full -mr-8 -mt-8"></div>
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
      ? `${getFreeTimeLabel(dayDeal.free_time[isEBike ? 'ebike' : 'bike'])} of included time`
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
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('no_passes_available')}</h3>
                      <p className="text-slate-600">{t('no_passes_description')} {selectedCity}.</p>
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
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('no_pricing_data')}</h3>
                <p className="text-slate-600">{t('no_pricing_description')} {selectedCity}.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
