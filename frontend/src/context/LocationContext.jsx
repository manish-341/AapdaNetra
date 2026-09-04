import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../lib/auth';
import { setDistrictLocation } from '../services/api';

const LocationContext = createContext();

export const PRESET_DISTRICTS = [
  { id: 'vindhya', name: 'Vindhya (MP)', district: 'Vindhya', state: 'Madhya Pradesh', lat: 24.5362, lng: 81.3038 },
  { id: 'delhi', name: 'Delhi (NCR)', district: 'Central Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { id: 'bhopal', name: 'Bhopal (MP)', district: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { id: 'indore', name: 'Indore (MP)', district: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { id: 'mumbai', name: 'Mumbai (MH)', district: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { id: 'bengaluru', name: 'Bengaluru (KA)', district: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { id: 'dehradun', name: 'Dehradun (UK)', district: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { id: 'guwahati', name: 'Guwahati (AS)', district: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  { id: 'gautam-buddha-nagar', name: 'Gautam Buddha Nagar (UP)', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', lat: 28.4744, lng: 77.5040 }
];

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('an_active_location');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
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
    const clean = district.toLowerCase();
    const matchedPreset = PRESET_DISTRICTS.find(p => p.district.toLowerCase().includes(clean) || clean.includes(p.district.toLowerCase()));

    if (matchedPreset) {
      setLocation(matchedPreset);
      localStorage.setItem('an_active_location', JSON.stringify(matchedPreset));
      try {
        await setDistrictLocation({ district: matchedPreset.district, state: matchedPreset.state });
      } catch (e) {
        console.warn('Set district API error:', e.message);
      }
      return matchedPreset;
    }

    // Call backend to geocode and auto-provision
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

      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          let resolvedName = 'Live GPS Location';
          let resolvedDistrict = 'Current Location';
          let resolvedState = 'India';

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
              headers: { 'User-Agent': 'AapdaNetra-App/2.0' }
            });
            const data = await res.json();
            if (data?.address) {
              resolvedDistrict = data.address.state_district || data.address.county || data.address.city || 'Detected Region';
              resolvedState = data.address.state || 'India';
              resolvedName = `${resolvedDistrict} (${resolvedState})`;
            }
          } catch (e) {
            console.warn('Reverse geocoding error:', e.message);
          }

          const gpsLoc = {
            name: resolvedName,
            district: resolvedDistrict,
            state: resolvedState,
            lat,
            lng,
            isGPS: true
          };

          setLocation(gpsLoc);
          localStorage.setItem('an_active_location', JSON.stringify(gpsLoc));
          setGpsLoading(false);
          resolve(gpsLoc);
        },
        (error) => {
          setGpsLoading(false);
          console.warn('GPS location error:', error.message);
          alert('GPS location permission denied. You can manually select your district from the dropdown.');
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 8000 }
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
