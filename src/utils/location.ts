// Utility functions for geolocation and distance calculation
import { ApiCity } from '../types/api';

// Haversine formula to calculate the distance between two lat/lng points in kilometers
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Radius of Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Extract lat/lng from a city object (from memberships_api_url or day_deals_api_url)
export function extractLatLng(city: ApiCity): { lat: number; lng: number } | null {
  // Try to extract from memberships_api_url (format: location=lat,lng)
  const match = city.memberships_api_url.match(/location=([\d.-]+),([\d.-]+)/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  // Fallback: try day_deals_api_url
  const match2 = city.day_deals_api_url.match(/location=([\d.-]+),([\d.-]+)/);
  if (match2) {
    return { lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) };
  }
  return null;
}

// Find the closest city to a given lat/lng
export function findClosestCity(lat: number, lng: number, cities: ApiCity[]): ApiCity | null {
  let minDist = Infinity;
  let closest: ApiCity | null = null;
  for (const city of cities) {
    const coords = extractLatLng(city);
    if (!coords) continue;
    const dist = haversineDistance(lat, lng, coords.lat, coords.lng);
    if (dist < minDist) {
      minDist = dist;
      closest = city;
    }
  }
  return closest;
}
