import { GeofenceCheckResult, LocationStatus } from './types';

/**
 * Calculates great-circle distance between two points in meters using the Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

/**
 * Checks whether current coordinates are within the target project geofence radius
 */
export function checkGeofence(
  currentLat: number | null | undefined,
  currentLon: number | null | undefined,
  targetLat: number | null | undefined,
  targetLon: number | null | undefined,
  radiusMeters: number = 200
): GeofenceCheckResult {
  if (currentLat == null || currentLon == null) {
    return {
      distanceMeters: -1,
      status: 'LOCATION_DISABLED',
      isWithin: false,
    };
  }

  if (targetLat == null || targetLon == null) {
    // If target project does not have geofence defined, accept as within
    return {
      distanceMeters: 0,
      status: 'WITHIN_GEOFENCE',
      isWithin: true,
    };
  }

  const distance = calculateHaversineDistance(currentLat, currentLon, targetLat, targetLon);
  const isWithin = distance <= radiusMeters;

  return {
    distanceMeters: distance,
    status: isWithin ? 'WITHIN_GEOFENCE' : 'OUT_OF_RANGE',
    isWithin,
  };
}

/**
 * Formats distance into clean readable string (m or km)
 */
export function formatDistance(meters: number): string {
  if (meters < 0) return 'Unknown';
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Returns color classes for location status badge
 */
export function getLocationStatusBadge(status: LocationStatus): {
  label: string;
  className: string;
  bgDot: string;
} {
  switch (status) {
    case 'WITHIN_GEOFENCE':
      return {
        label: 'Within Geofence',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        bgDot: 'bg-emerald-500',
      };
    case 'OUT_OF_RANGE':
      return {
        label: 'Out of Range',
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        bgDot: 'bg-amber-500',
      };
    case 'LOCATION_DISABLED':
      return {
        label: 'GPS Disabled / Unavailable',
        className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        bgDot: 'bg-rose-500',
      };
  }
}
