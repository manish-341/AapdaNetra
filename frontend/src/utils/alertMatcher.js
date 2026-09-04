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
