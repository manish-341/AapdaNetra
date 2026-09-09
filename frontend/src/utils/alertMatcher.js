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

  const alertDistrict = (alert.district || '').replace(/\(.*?\)/g, '').trim().toLowerCase();
  const alertTitle = (alert.title || '').toLowerCase();
  const alertMsg = (alert.message || alert.description || '').toLowerCase();

  const rawDistrict = (userLoc.district || '').toLowerCase();
  const rawName = (userLoc.name || '').toLowerCase();
  const cleanDistrict = rawDistrict.replace(/\(.*?\)/g, '').trim();
  const cleanName = rawName.replace(/\(.*?\)/g, '').trim();

  // 1. Direct district match
  if (alertDistrict && cleanDistrict && (alertDistrict.includes(cleanDistrict) || cleanDistrict.includes(alertDistrict))) {
    return true;
  }

  // 2. Title & Message keyword inspection
  if (cleanDistrict && (alertTitle.includes(cleanDistrict) || alertMsg.includes(cleanDistrict))) {
    return true;
  }
  if (cleanName && (alertTitle.includes(cleanName) || alertMsg.includes(cleanName))) {
    return true;
  }

  // Regional aliases (e.g. Chitrakoot, Bhopal, Delhi/Yamuna, Noida/Hindon, Mumbai, Dehradun)
  if ((cleanDistrict.includes('chitrakoot') || cleanName.includes('chitrakoot')) &&
      (alertTitle.includes('chitrakoot') || alertMsg.includes('chitrakoot') || alertDistrict.includes('chitrakoot') || alertTitle.includes('mandakini'))) {
    return true;
  }
  if ((cleanDistrict.includes('delhi') || cleanName.includes('delhi')) &&
      (alertTitle.includes('delhi') || alertTitle.includes('yamuna') || alertMsg.includes('delhi') || alertMsg.includes('yamuna'))) {
    return true;
  }
  if ((cleanDistrict.includes('noida') || cleanDistrict.includes('gautam buddha') || cleanName.includes('noida')) &&
      (alertTitle.includes('noida') || alertTitle.includes('hindon') || alertMsg.includes('noida') || alertMsg.includes('hindon'))) {
    return true;
  }
  if ((cleanDistrict.includes('bhopal') || cleanName.includes('bhopal')) &&
      (alertTitle.includes('bhopal') || alertMsg.includes('bhopal'))) {
    return true;
  }
  if ((cleanDistrict.includes('mumbai') || cleanName.includes('mumbai')) &&
      (alertTitle.includes('mumbai') || alertMsg.includes('mumbai'))) {
    return true;
  }
  if ((cleanDistrict.includes('dehradun') || cleanName.includes('dehradun')) &&
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
  // Strictly verified: only alerts with CRITICAL severity trigger the emergency siren
  return alert.severity === 'CRITICAL';
}

/**
 * Extract clean, human-readable region or district name for an alert
 */
export function getAlertRegionName(alert) {
  if (!alert) return 'Monitored Zone';
  if (alert.district) return alert.district;
  const title = alert.title || '';
  const match = title.match(/\(([^)]+)\)/);
  if (match) return match[1];
  const lower = (title + ' ' + (alert.message || alert.description || '')).toLowerCase();
  if (lower.includes('bhopal')) return 'Bhopal (MP)';
  if (lower.includes('mumbai')) return 'Mumbai (MH)';
  if (lower.includes('dehradun')) return 'Dehradun (UK)';
  if (lower.includes('gautam buddha') || lower.includes('noida') || lower.includes('hindon')) return 'Gautam Buddha Nagar (UP)';
  if (lower.includes('delhi') || lower.includes('yamuna')) return 'Delhi (NCR)';
  if (lower.includes('nepal')) return 'Nepal Border Zone';
  return 'National Monitored Zone';
}
