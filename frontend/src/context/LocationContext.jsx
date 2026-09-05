import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../lib/auth';
import { setDistrictLocation } from '../services/api';
import { stopEmergencySiren } from '../utils/emergencyAudio';

const LocationContext = createContext();

export const PRESET_DISTRICTS = [
  { id: 'vindhya', name: 'Vindhya (MP)', district: 'Vindhya', state: 'Madhya Pradesh', lat: 24.5362, lng: 81.3038 },
  { id: 'ranchi', name: 'Ranchi (JH)', district: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  { id: 'delhi', name: 'Delhi (NCR)', district: 'Central Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { id: 'gautam-buddha-nagar', name: 'Gautam Buddha Nagar (UP)', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', lat: 28.4744, lng: 77.5040 },
  { id: 'mumbai', name: 'Mumbai (MH)', district: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { id: 'pune', name: 'Pune (MH)', district: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { id: 'kolkata', name: 'Kolkata (WB)', district: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { id: 'bhopal', name: 'Bhopal (MP)', district: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { id: 'indore', name: 'Indore (MP)', district: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { id: 'patna', name: 'Patna (BR)', district: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { id: 'bengaluru', name: 'Bengaluru (KA)', district: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { id: 'chennai', name: 'Chennai (TN)', district: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { id: 'hyderabad', name: 'Hyderabad (TG)', district: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { id: 'jaipur', name: 'Jaipur (RJ)', district: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { id: 'lucknow', name: 'Lucknow (UP)', district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { id: 'dehradun', name: 'Dehradun (UK)', district: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { id: 'guwahati', name: 'Guwahati (AS)', district: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  { id: 'srinagar', name: 'Srinagar (JK)', district: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lng: 74.7973 },
  { id: 'bhubaneswar', name: 'Bhubaneswar (OD)', district: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { id: 'raipur', name: 'Raipur (CG)', district: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { id: 'chandigarh', name: 'Chandigarh (CH)', district: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 }
];

export const INDIAN_DISTRICT_GAZETTEER = {
  // Jharkhand
  'ranchi': { lat: 23.3441, lng: 85.3096, state: 'Jharkhand', name: 'Ranchi' },
  'jamshedpur': { lat: 22.8046, lng: 86.2029, state: 'Jharkhand', name: 'Jamshedpur' },
  'dhanbad': { lat: 23.7957, lng: 86.4304, state: 'Jharkhand', name: 'Dhanbad' },
  'bokaro': { lat: 23.6693, lng: 86.1511, state: 'Jharkhand', name: 'Bokaro' },
  'deoghar': { lat: 24.4826, lng: 86.7003, state: 'Jharkhand', name: 'Deoghar' },
  'hazaribagh': { lat: 23.9961, lng: 85.3637, state: 'Jharkhand', name: 'Hazaribagh' },

  // Madhya Pradesh
  'vindhya': { lat: 24.5362, lng: 81.3038, state: 'Madhya Pradesh', name: 'Vindhya / Rewa' },
  'rewa': { lat: 24.5362, lng: 81.3038, state: 'Madhya Pradesh', name: 'Rewa' },
  'satna': { lat: 24.5805, lng: 80.8252, state: 'Madhya Pradesh', name: 'Satna' },
  'sidhi': { lat: 24.4033, lng: 81.8791, state: 'Madhya Pradesh', name: 'Sidhi' },
  'singrauli': { lat: 24.1992, lng: 82.6645, state: 'Madhya Pradesh', name: 'Singrauli' },
  'bhopal': { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh', name: 'Bhopal' },
  'indore': { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh', name: 'Indore' },
  'jabalpur': { lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh', name: 'Jabalpur' },
  'gwalior': { lat: 26.2183, lng: 78.1828, state: 'Madhya Pradesh', name: 'Gwalior' },
  'ujjain': { lat: 23.1765, lng: 75.7885, state: 'Madhya Pradesh', name: 'Ujjain' },

  // Delhi & NCR
  'delhi': { lat: 28.6139, lng: 77.2090, state: 'Delhi', name: 'Delhi' },
  'central delhi': { lat: 28.6139, lng: 77.2090, state: 'Delhi', name: 'Central Delhi' },
  'north delhi': { lat: 28.6800, lng: 77.1950, state: 'Delhi', name: 'North Delhi' },
  'east delhi': { lat: 28.6280, lng: 77.2800, state: 'Delhi', name: 'East Delhi' },
  'south delhi': { lat: 28.5200, lng: 77.2100, state: 'Delhi', name: 'South Delhi' },
  'west delhi': { lat: 28.6663, lng: 77.0674, state: 'Delhi', name: 'West Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.2090, state: 'Delhi', name: 'New Delhi' },
  'gautam buddha nagar': { lat: 28.4744, lng: 77.5040, state: 'Uttar Pradesh', name: 'Gautam Buddha Nagar' },
  'noida': { lat: 28.5355, lng: 77.3910, state: 'Uttar Pradesh', name: 'Noida' },
  'greater noida': { lat: 28.4744, lng: 77.5040, state: 'Uttar Pradesh', name: 'Greater Noida' },
  'ghaziabad': { lat: 28.6692, lng: 77.4538, state: 'Uttar Pradesh', name: 'Ghaziabad' },
  'gurugram': { lat: 28.4595, lng: 77.0266, state: 'Haryana', name: 'Gurugram' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, state: 'Haryana', name: 'Gurugram' },
  'faridabad': { lat: 28.4089, lng: 77.3178, state: 'Haryana', name: 'Faridabad' },

  // Maharashtra
  'mumbai': { lat: 19.0760, lng: 72.8777, state: 'Maharashtra', name: 'Mumbai' },
  'pune': { lat: 18.5204, lng: 73.8567, state: 'Maharashtra', name: 'Pune' },
  'nagpur': { lat: 21.1458, lng: 79.0882, state: 'Maharashtra', name: 'Nagpur' },
  'nashik': { lat: 19.9975, lng: 73.7898, state: 'Maharashtra', name: 'Nashik' },
  'thane': { lat: 19.2183, lng: 72.9781, state: 'Maharashtra', name: 'Thane' },
  'aurangabad': { lat: 19.8762, lng: 75.3433, state: 'Maharashtra', name: 'Chhatrapati Sambhajinagar' },
  'chhatrapati sambhajinagar': { lat: 19.8762, lng: 75.3433, state: 'Maharashtra', name: 'Chhatrapati Sambhajinagar' },

  // Uttar Pradesh
  'lucknow': { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh', name: 'Lucknow' },
  'kanpur': { lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh', name: 'Kanpur' },
  'varanasi': { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh', name: 'Varanasi' },
  'prayagraj': { lat: 25.4358, lng: 81.8463, state: 'Uttar Pradesh', name: 'Prayagraj' },
  'allahabad': { lat: 25.4358, lng: 81.8463, state: 'Uttar Pradesh', name: 'Prayagraj' },
  'agra': { lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh', name: 'Agra' },
  'meerut': { lat: 28.9845, lng: 77.7064, state: 'Uttar Pradesh', name: 'Meerut' },
  'gorakhpur': { lat: 26.7606, lng: 83.3732, state: 'Uttar Pradesh', name: 'Gorakhpur' },
  'ayodhya': { lat: 26.7922, lng: 82.1998, state: 'Uttar Pradesh', name: 'Ayodhya' },

  // Bihar
  'patna': { lat: 25.5941, lng: 85.1376, state: 'Bihar', name: 'Patna' },
  'gaya': { lat: 24.7914, lng: 85.0002, state: 'Bihar', name: 'Gaya' },
  'muzaffarpur': { lat: 26.1209, lng: 85.3647, state: 'Bihar', name: 'Muzaffarpur' },
  'bhagalpur': { lat: 25.2425, lng: 86.9842, state: 'Bihar', name: 'Bhagalpur' },

  // West Bengal
  'kolkata': { lat: 22.5726, lng: 88.3639, state: 'West Bengal', name: 'Kolkata' },
  'howrah': { lat: 22.5958, lng: 88.2636, state: 'West Bengal', name: 'Howrah' },
  'siliguri': { lat: 26.7271, lng: 88.3953, state: 'West Bengal', name: 'Siliguri' },
  'darjeeling': { lat: 27.0410, lng: 88.2663, state: 'West Bengal', name: 'Darjeeling' },

  // South India
  'bengaluru': { lat: 12.9716, lng: 77.5946, state: 'Karnataka', name: 'Bengaluru' },
  'bangalore': { lat: 12.9716, lng: 77.5946, state: 'Karnataka', name: 'Bengaluru' },
  'mysuru': { lat: 12.2958, lng: 76.6394, state: 'Karnataka', name: 'Mysuru' },
  'chennai': { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu', name: 'Chennai' },
  'coimbatore': { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu', name: 'Coimbatore' },
  'madurai': { lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu', name: 'Madurai' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, state: 'Telangana', name: 'Hyderabad' },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh', name: 'Visakhapatnam' },
  'vijayawada': { lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh', name: 'Vijayawada' },
  'thiruvananthapuram': { lat: 8.5241, lng: 76.9366, state: 'Kerala', name: 'Thiruvananthapuram' },
  'kochi': { lat: 9.9312, lng: 76.2673, state: 'Kerala', name: 'Kochi' },
  'kozhikode': { lat: 11.2588, lng: 75.7804, state: 'Kerala', name: 'Kozhikode' },

  // North & West India
  'jaipur': { lat: 26.9124, lng: 75.7873, state: 'Rajasthan', name: 'Jaipur' },
  'jodhpur': { lat: 26.2389, lng: 73.0243, state: 'Rajasthan', name: 'Jodhpur' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, state: 'Gujarat', name: 'Ahmedabad' },
  'surat': { lat: 21.1702, lng: 72.8311, state: 'Gujarat', name: 'Surat' },
  'vadodara': { lat: 22.3072, lng: 73.1812, state: 'Gujarat', name: 'Vadodara' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, state: 'Chandigarh', name: 'Chandigarh' },
  'amritsar': { lat: 31.6340, lng: 74.8723, state: 'Punjab', name: 'Amritsar' },
  'dehradun': { lat: 30.3165, lng: 78.0322, state: 'Uttarakhand', name: 'Dehradun' },
  'shimla': { lat: 31.1048, lng: 77.1734, state: 'Himachal Pradesh', name: 'Shimla' },
  'srinagar': { lat: 34.0837, lng: 74.7973, state: 'Jammu and Kashmir', name: 'Srinagar' },
  'jammu': { lat: 32.7266, lng: 74.8570, state: 'Jammu and Kashmir', name: 'Jammu' },

  // East & North-East
  'bhubaneswar': { lat: 20.2961, lng: 85.8245, state: 'Odisha', name: 'Bhubaneswar' },
  'raipur': { lat: 21.2514, lng: 81.6296, state: 'Chhattisgarh', name: 'Raipur' },
  'guwahati': { lat: 26.1445, lng: 91.7362, state: 'Assam', name: 'Guwahati' },
  'shillong': { lat: 25.5788, lng: 91.8933, state: 'Meghalaya', name: 'Shillong' },
  'imphal': { lat: 24.8170, lng: 93.9368, state: 'Manipur', name: 'Imphal' },
  'agartala': { lat: 23.8315, lng: 91.2868, state: 'Tripura', name: 'Agartala' }
};

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('an_active_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.district) {
          const clean = parsed.district.toLowerCase().trim();
          const gz = INDIAN_DISTRICT_GAZETTEER[clean];
          if (gz && !clean.includes('rewa') && !clean.includes('vindhya')) {
            const isMisplaced = Math.abs(parsed.lat - 24.5362) < 0.05 && Math.abs(parsed.lng - 81.3038) < 0.05;
            if (isMisplaced) {
              parsed.lat = gz.lat;
              parsed.lng = gz.lng;
              parsed.state = gz.state;
              parsed.name = `${gz.name} (${gz.state})`;
              localStorage.setItem('an_active_location', JSON.stringify(parsed));
            }
          }
        }
        return parsed;
      } catch {}
    }

    const user = getCurrentUser();
    if (user?.district) {
      const d = user.district.toLowerCase();
      if (d.includes('vindhya') || d.includes('rewa')) {
        return PRESET_DISTRICTS[0]; // Vindhya
      }
      if (user.coordinates?.latitude && user.coordinates?.longitude) {
        return {
          name: `${user.district} (${user.state || 'India'})`,
          district: user.district,
          state: user.state || 'India',
          lat: user.coordinates.latitude,
          lng: user.coordinates.longitude,
          isGPS: false
        };
      }
    }

    return PRESET_DISTRICTS[0]; // Default to Vindhya / MP or first preset
  });

  const [gpsLoading, setGpsLoading] = useState(false);

  // Sync with user profile on change
  useEffect(() => {
    const user = getCurrentUser();
    if (user?.district) {
      const d = user.district.toLowerCase();
      if (d.includes('vindhya') || d.includes('rewa')) {
        const vindhyaLoc = PRESET_DISTRICTS[0];
        setLocation(vindhyaLoc);
        localStorage.setItem('an_active_location', JSON.stringify(vindhyaLoc));
      }
    }
  }, []);

  const switchLocation = async (district, state = '') => {
    // Instantly terminate any active civil defense siren on location change
    try {
      stopEmergencySiren();
    } catch {}

    const clean = district.toLowerCase().trim();

    // 1. Direct preset match
    let matched = PRESET_DISTRICTS.find(p => p.district.toLowerCase() === clean || p.district.toLowerCase().includes(clean) || clean.includes(p.district.toLowerCase()));

    // 2. Gazetteer lookup for any Indian district/city
    if (!matched) {
      for (const [key, val] of Object.entries(INDIAN_DISTRICT_GAZETTEER)) {
        if (clean === key || clean.includes(key) || key.includes(clean)) {
          matched = {
            id: key,
            name: `${val.name} (${val.state})`,
            district: val.name,
            state: val.state,
            lat: val.lat,
            lng: val.lng,
            isGPS: false
          };
          break;
        }
      }
    }

    if (matched) {
      setLocation(matched);
      localStorage.setItem('an_active_location', JSON.stringify(matched));
      try {
        await setDistrictLocation({ district: matched.district, state: matched.state });
      } catch (e) {
        console.warn('Set district API error:', e.message);
      }
      return matched;
    }

    // 3. Fallback geocoding via backend
    try {
      const res = await setDistrictLocation({ district, state });
      const data = res.data?.data;
      if (data) {
        const newLoc = {
          name: `${data.district} (${data.state})`,
          district: data.district,
          state: data.state,
          lat: data.latitude,
          lng: data.longitude,
          isGPS: false
        };
        setLocation(newLoc);
        localStorage.setItem('an_active_location', JSON.stringify(newLoc));
        return newLoc;
      }
    } catch (err) {
      console.error('Error switching district location:', err);
    }
  };

  const detectLiveGPS = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return reject(new Error('Geolocation unsupported'));
      }

      try {
        stopEmergencySiren();
      } catch {}

      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          let resolvedDistrict = '';
          let resolvedState = '';

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
              headers: { 'User-Agent': 'AapdaNetra-Emergency-System/2.0' },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            const data = await res.json();
            if (data?.address) {
              resolvedDistrict = data.address.state_district || data.address.county || data.address.city || data.address.town || data.address.suburb || '';
              resolvedState = data.address.state || '';
            }
          } catch (e) {
            console.warn('Reverse geocoding notice:', e.message);
          }

          // Fallback: Bind to nearest known district via Haversine if reverse lookup was vague
          if (!resolvedDistrict || resolvedDistrict === 'Detected Region' || resolvedDistrict === 'Current Location') {
            let minDist = Infinity;
            let bestMatch = PRESET_DISTRICTS[0];
            for (const p of PRESET_DISTRICTS) {
              const dLat = ((p.lat - lat) * Math.PI) / 180;
              const dLon = ((p.lng - lng) * Math.PI) / 180;
              const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((p.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
              const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              if (dist < minDist) {
                minDist = dist;
                bestMatch = p;
              }
            }
            resolvedDistrict = bestMatch.district;
            resolvedState = bestMatch.state;
          }

          // Clean up common Indian administrative affixes
          resolvedDistrict = resolvedDistrict.replace(/district/i, '').replace(/division/i, '').trim();

          const resolvedName = `${resolvedDistrict} (${resolvedState || 'Live GPS'})`;

          const gpsLoc = {
            id: 'gps-live',
            name: resolvedName,
            district: resolvedDistrict,
            state: resolvedState || 'India',
            lat,
            lng,
            isGPS: true
          };

          setLocation(gpsLoc);
          localStorage.setItem('an_active_location', JSON.stringify(gpsLoc));
          setDistrictLocation(resolvedDistrict, resolvedState, lat, lng).catch(() => {});
          setGpsLoading(false);
          resolve(gpsLoc);
        },
        (error) => {
          setGpsLoading(false);
          console.warn('GPS location error:', error.message);
          let msg = 'GPS location permission was denied. You can still manually select or search your district.';
          if (error.code === 2) msg = 'GPS satellite signal unavailable. Please select your district manually.';
          if (error.code === 3) msg = 'GPS location request timed out. Please try again.';
          alert(msg);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  };

  return (
    <LocationContext.Provider value={{
      location,
      setLocation,
      switchLocation,
      detectLiveGPS,
      gpsLoading,
      presets: PRESET_DISTRICTS
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return ctx;
}
