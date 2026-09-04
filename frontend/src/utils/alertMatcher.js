// Geospatial & district semantic intelligence matcher
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function alertMatchesLocation(alert, userLoc) {
  if (!userLoc) return false;

  const alertDistrict = (alert.district || '').trim().toLowerCase();
  const alertTitle = (alert.title || '').toLowerCase();
  const alertMsg = (alert.message || alert.description || '').toLowerCase();

  const userDistrict = (userLoc.district || '').trim().toLowerCase();
  const userName = (userLoc.name || '').toLowerCase();

  // 1. Direct district match
  if (alertDistrict && userDistrict && (alertDistrict.includes(userDistrict) || userDistrict.includes(alertDistrict))) {
    return true;
  }

  // 2. Title & Message keyword inspection
  if (userDistrict && (alertTitle.includes(userDistrict) || alertMsg.includes(userDistrict))) {
    return true;
  }

  // Regional aliases (e.g. Bhopal, Delhi/Yamuna, Noida/Hindon, Mumbai, Dehradun)
  if ((userDistrict.includes('delhi') || userName.includes('delhi')) &&
      (alertTitle.includes('delhi') || alertTitle.includes('yamuna') || alertMsg.includes('delhi') || alertMsg.includes('yamuna'))) {
    return true;
  }
  if ((userDistrict.includes('noida') || userDistrict.includes('gautam buddha') || userName.includes('noida')) &&
      (alertTitle.includes('noida') || alertTitle.includes('hindon') || alertMsg.includes('noida') || alertMsg.includes('hindon'))) {
    return true;
  }
  if ((userDistrict.includes('bhopal') || userName.includes('bhopal')) &&
      (alertTitle.includes('bhopal') || alertMsg.includes('bhopal'))) {
    return true;
  }
  if ((userDistrict.includes('mumbai') || userName.includes('mumbai')) &&
      (alertTitle.includes('mumbai') || alertMsg.includes('mumbai'))) {
    return true;
  }
  if ((userDistrict.includes('dehradun') || userName.includes('dehradun')) &&
      (alertTitle.includes('dehradun') || alertMsg.includes('dehradun'))) {
    return true;
  }

  // 3. Coordinate distance check
  if (userLoc.lat && userLoc.lng && alert.location?.coordinates && alert.location.coordinates.length === 2) {
    const [alertLng, alertLat] = alert.location.coordinates;
    const dist = getDistanceKm(userLoc.lat, userLoc.lng, alertLat, alertLng);
    const radius = alert.affectedRadius || 30;
    if (dist <= radius) {
      return true;
    }
  }

  return false;
}

/**
 * Strict verification of whether an alert qualifies as an immediate CRITICAL life-safety emergency
 * that warrants an acoustic civil defense siren.
 * 
 * Rules:
 * - Must have severity === 'CRITICAL'
 * - Must NOT be a watch, early warning, advisory, forecast, monitoring, precaution, or minor waterlogging
 * - Must be an active, verified emergency situation
 */
export function isTrueCriticalAlert(alert) {
  if (!alert || alert.isActive === false) return false;
  if (alert.severity !== 'CRITICAL') return false;

  const title = (alert.title || '').toLowerCase();
  const message = (alert.message || alert.description || '').toLowerCase();

  // Explicit non-critical keywords in title or message
  const advisoryKeywords = [
    'watch',
    'early warning',
    'advisory',
    'forecast',
    'monitoring',
    'precaution',
    'waterlogging',
    'elevated risk',
    'preparedness'
  ];

  for (const kw of advisoryKeywords) {
    if (title.includes(kw)) {
      return false; // Title explicitly indicates Watch / Early Warning / Advisory
    }
  }

  return true;
}
