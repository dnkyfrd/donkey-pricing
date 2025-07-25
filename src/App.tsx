import React, { useState, useEffect } from 'react';
import { ChevronDown, MapPin, Star, Zap, Bike, AlertCircle } from 'lucide-react';
import { groupedCities } from './data/cities';
import { CityPricingData, MembershipPlan } from './types/api';
import { LoadingSpinner } from './components/LoadingSpinner';

function App() {
  // ⬇️ Add this useEffect to send iframe height
  useEffect(() => {
    const sendHeightToParent = () => {
      const height = document.documentElement.scrollHeight || document.body.scrollHeight;
      window.parent.postMessage(
        {
          type: 'setHeight',
          height,
        },
        '*' // Optional: use 'https://donkey.bike' for stricter security
      );
    };

    sendHeightToParent();

    const resizeObserver = new ResizeObserver(sendHeightToParent);
    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  // ⬆️ End of iframe height logic

  const [selectedCountry, setSelectedCountry] = useState('Denmark');
  const [selectedCity, setSelectedCity] = useState('Copenhagen');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [pricingData, setPricingData] = useState<CityPricingData | null>(null);
  const [allPricing, setAllPricing] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countries = Object.keys(groupedCities);
  const cities = React.useMemo(() => selectedCountry ? groupedCities[selectedCountry] || [] : [], [selectedCountry]);

  useEffect(() => {
    if (selectedCountry && cities.length > 0 && !cities.find(city => city.city_name === selectedCity)) {
      setSelectedCity(cities[0].city_name);
    }
  }, [selectedCountry, cities, selectedCity]);

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

  const formatPrice = (price: number, currency: string = 'EUR') => `${Math.ceil(Number(price))} ${currency}`;

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

  function isIntervalPricing(duration: any): duration is import('./types/api').IntervalPricing {
    return (
      duration &&
      typeof duration === 'object' &&
      !Array.isArray(duration) &&
      typeof duration.interval_length_minutes !== 'undefined' &&
      typeof duration.starting_fee_in_major_units !== 'undefined'
    );
  }

  const chunkMemberships = (memberships: MembershipPlan[], size: number) => {
    const chunks = [];
    for (let i = 0; i < memberships.length; i += size) {
      chunks.push(memberships.slice(i, i + size));
    }
    return chunks;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
      {/* ...your entire return JSX remains unchanged... */}
      {/* Only the useEffect at the top was added */}
    </div>
  );
}

export default App;
