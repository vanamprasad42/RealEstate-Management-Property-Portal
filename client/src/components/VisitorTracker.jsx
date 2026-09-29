import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';

const VisitorTracker = () => {
  const location = useLocation();
  const lastTrackedPath = useRef('');
  const gpsChecked = useRef(false);
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    // Avoid double logging on the exact same pathname
    if (lastTrackedPath.current === location.pathname) return;
    lastTrackedPath.current = location.pathname;

    const track = async () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        
        // Check if cached exact location exists in sessionStorage
        let cachedGeo = null;
        try {
          const stored = sessionStorage.getItem('re_visitor_exact_geo');
          if (stored) cachedGeo = JSON.parse(stored);
        } catch (e) {}

        const payload = {
          page: location.pathname,
          referrer: document.referrer || 'Direct',
          timezone,
          userId: userInfo?._id || null,
          ...(cachedGeo || {})
        };

        await api.post('/visitors/track', payload);

        // Attempt device GPS check if not already performed this session
        if (!gpsChecked.current && typeof navigator !== 'undefined' && navigator.geolocation) {
          gpsChecked.current = true;
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude, longitude, accuracy } = pos.coords;
              try {
                // Reverse geocode via OpenStreetMap Nominatim
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
                  headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                  const data = await res.json();
                  const addr = data.address || {};
                  const exactGeo = {
                    latitude,
                    longitude,
                    accuracy,
                    exactAddress: data.display_name || '',
                    street: addr.road || addr.street || addr.pedestrian || '',
                    neighbourhood: addr.neighbourhood || addr.suburb || addr.residential || '',
                    city: addr.city || addr.town || addr.village || '',
                    region: addr.state || addr.province || '',
                    postcode: addr.postcode || '',
                    country: addr.country || '',
                    countryCode: (addr.country_code || '').toUpperCase(),
                    locationSource: 'GPS (Exact)'
                  };

                  try {
                    sessionStorage.setItem('re_visitor_exact_geo', JSON.stringify(exactGeo));
                  } catch (e) {}

                  // Send updated exact location payload
                  await api.post('/visitors/track', {
                    page: location.pathname,
                    timezone,
                    userId: userInfo?._id || null,
                    ...exactGeo
                  });
                }
              } catch (e) {
                // If client reverse-geocode blocked by browser, send raw coordinates to backend
                await api.post('/visitors/track', {
                  page: location.pathname,
                  latitude,
                  longitude,
                  accuracy,
                  locationSource: 'GPS (Exact)'
                });
              }
            },
            () => {
              // Permission dismissed or denied - backend automatically uses IP coordinates reverse geocoding
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
          );
        }
      } catch (err) {
        // Silently catch so user browsing is never interrupted
      }
    };

    track();
  }, [location.pathname, userInfo]);

  return null;
};

export default VisitorTracker;
