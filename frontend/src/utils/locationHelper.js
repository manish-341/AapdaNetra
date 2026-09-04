/**
 * Location Filtering Utilities for AapdaNetra Multi-District Intelligence
 */

export function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 99999;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const KNOWN_DISTRICTS = [
  'guwahati', 'delhi', 'vindhya', 'rewa', 'satna', 'sidhi',
  'bengaluru', 'bangalore', 'mumbai', 'bhopal', 'indore',
  'chennai', 'kolkata', 'jaipur', 'lucknow', 'dehradun',
  'gautam buddha nagar', 'noida', 'greater noida'
];

/**
 * Returns true if an item belongs strictly to the currently active operational location/district.
 * Excludes foreign district items and filters by geographical radius (< 150 km).
 */
export function isItemInActiveLocation(item, activeLoc) {
  if (!activeLoc) return true;

  const activeDistrict = (activeLoc.district || '').toLowerCase().trim();
  const activeState = (activeLoc.state || '').toLowerCase().trim();
  const activeName = (activeLoc.name || '').toLowerCase().trim();

  // 1. Direct district match
  if (item.district) {
    const itemDist = item.district.toLowerCase().trim();
    if (
      itemDist === activeDistrict ||
      itemDist.includes(activeDistrict) ||
      activeDistrict.includes(itemDist)
    ) {
      return true;
    }
    // If the item specifically has another district, reject it
    return false;
  }

  // 2. Alert / Text title & description matching
  const text = `${item.title || ''} ${item.message || ''} ${item.name || ''} ${item.description || ''}`.toLowerCase();

  // Check if text specifically mentions a foreign district
  for (const kd of KNOWN_DISTRICTS) {
    if (text.includes(kd) && !activeDistrict.includes(kd) && !activeName.includes(kd)) {
      return false; // Explicitly belongs to another district (e.g. Bengaluru, Vindhya)
    }
  }

  // If text mentions active district or state, accept
  if (activeDistrict && text.includes(activeDistrict)) return true;
  if (activeState && text.includes(activeState)) return true;

  // 3. Proximity coordinates check (within 150km of active view)
  let coords = null;
  if (item.location?.coordinates && Array.isArray(item.location.coordinates)) {
    coords = item.location.coordinates; // [lng, lat]
  } else if (item.geometry?.coordinates?.[0]?.[0] && Array.isArray(item.geometry.coordinates[0][0])) {
    coords = item.geometry.coordinates[0][0]; // [lng, lat]
  } else if (item.origin && Array.isArray(item.origin)) {
    coords = [item.origin[1], item.origin[0]]; // [lng, lat]
  }

  if (coords && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    const dist = getDistanceKm(activeLoc.lat, activeLoc.lng, coords[1], coords[0]);
    return dist <= 150;
  }

  // If no distinguishing district or coordinate data, default to true
  return true;
}
