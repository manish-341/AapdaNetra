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

const NOIDA_CLUSTER = ['gautam buddha nagar', 'noida', 'greater noida', 'gb nagar', 'dadri', 'kasna', 'surajpur'];
const DELHI_CLUSTER = ['delhi', 'central delhi', 'new delhi', 'south delhi', 'north delhi', 'east delhi', 'west delhi', 'yamuna floodplain', 'burari'];
const BHOPAL_CLUSTER = ['bhopal', 'upper lake', 'halali', 'shahpura', 'tt nagar'];
const CHITRAKOOT_CLUSTER = ['chitrakoot', 'chitrakut', 'karwi', 'mandakini', 'ramghat', 'sitapur'];
const BIHAR_CLUSTER = [
  'bihar', 'patna', 'supaul', 'khagaria', 'bhagalpur', 'muzaffarpur',
  'madhubani', 'siwan', 'ganga', 'kosi', 'bagmati', 'gandak', 'kamla',
  'jhanjharpur', 'benibad', 'sultanganj', 'baltara', 'birpur'
];

const KNOWN_DISTRICTS = [
  'guwahati', 'delhi', 'vindhya', 'rewa', 'satna', 'sidhi',
  'bengaluru', 'bangalore', 'mumbai', 'bhopal', 'indore',
  'chennai', 'kolkata', 'jaipur', 'lucknow', 'dehradun',
  'gautam buddha nagar', 'noida', 'greater noida', 'chitrakoot',
  'patna', 'bihar'
];

function checkClusterMatch(d1, d2, cluster) {
  const m1 = cluster.some((k) => d1.includes(k));
  const m2 = cluster.some((k) => d2.includes(k));
  return m1 && m2;
}

/**
 * Returns true if an item belongs strictly to the currently active operational location/district.
 * Excludes foreign district items and filters by geographical radius (< 150 km).
 */
export function isItemInActiveLocation(item, activeLoc) {
  if (!activeLoc) return true;

  const rawDistrict = (activeLoc.district || activeLoc.name || '').toLowerCase().trim();
  const rawName = (activeLoc.name || '').toLowerCase().trim();
  const activeDistrict = rawDistrict.replace(/\(.*?\)/g, '').trim();
  const activeName = rawName.replace(/\(.*?\)/g, '').trim();
  const activeState = (activeLoc.state || '').toLowerCase().trim();
  const fullActive = `${activeDistrict} ${activeName} ${activeState}`;

  // 1. Direct cluster match
  const itemDist = (item.district || '').toLowerCase().replace(/\(.*?\)/g, '').trim();
  const itemName = (item.name || '').toLowerCase().trim();
  const itemTitle = (item.title || '').toLowerCase().trim();
  const fullItem = `${itemDist} ${itemName} ${itemTitle}`;

  if (itemDist) {
    if (
      itemDist === activeDistrict ||
      (activeDistrict && (itemDist.includes(activeDistrict) || activeDistrict.includes(itemDist))) ||
      (activeName && (itemDist.includes(activeName) || activeName.includes(itemDist)))
    ) {
      return true;
    }

    if (checkClusterMatch(fullItem, fullActive, NOIDA_CLUSTER)) return true;
    if (checkClusterMatch(fullItem, fullActive, DELHI_CLUSTER)) return true;
    if (checkClusterMatch(fullItem, fullActive, BHOPAL_CLUSTER)) return true;
    if (checkClusterMatch(fullItem, fullActive, CHITRAKOOT_CLUSTER)) return true;
    if (checkClusterMatch(fullItem, fullActive, BIHAR_CLUSTER)) return true;

    // If the item specifically has another district and doesn't share a cluster, reject it
    return false;
  }

  // 2. Alert / Text title & description matching
  const text = `${item.title || ''} ${item.message || ''} ${item.name || ''} ${item.description || ''}`.toLowerCase();

  // Check if text specifically mentions a foreign district outside active cluster
  for (const kd of KNOWN_DISTRICTS) {
    if (text.includes(kd) && !activeDistrict.includes(kd) && !activeName.includes(kd)) {
      if (
        checkClusterMatch(kd, fullActive, BIHAR_CLUSTER) ||
        checkClusterMatch(kd, fullActive, NOIDA_CLUSTER) ||
        checkClusterMatch(kd, fullActive, DELHI_CLUSTER) ||
        checkClusterMatch(kd, fullActive, BHOPAL_CLUSTER) ||
        checkClusterMatch(kd, fullActive, CHITRAKOOT_CLUSTER)
      ) {
        continue; // Belongs to same regional cluster
      }
      return false; // Explicitly belongs to another foreign region
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
