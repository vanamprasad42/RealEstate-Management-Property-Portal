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
          if (stored) {
            const parsed = JSON.parse(stored);
            // Invalidate if stale or city doesn't match address
            if (parsed?.exactAddress && parsed?.city && parsed.exactAddress.toLowerCase().includes('telangana') && parsed.city.toLowerCase().includes('chennai')) {
              sessionStorage.removeItem('re_visitor_exact_geo');
            } else if (parsed?.latitude && parsed?.longitude) {
              cachedGeo = parsed;
            }
          }
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
                // Reverse geocode via OpenStreetMap Nominatim with English preference
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`, {
                  headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                  const data = await res.json();
                  const addr = data.address || {};
                  const resolvedCity = addr.city || addr.town || addr.municipality || addr.city_district || addr.county || addr.suburb || addr.village || addr.hamlet || addr.state_district || '';
                  const resolvedRegion = addr.state || addr.province || addr.state_district || '';
                  const resolvedNeighbourhood = addr.neighbourhood || addr.suburb || addr.residential || addr.subdivision || addr.hamlet || '';
                  const resolvedStreet = addr.road || addr.street || addr.pedestrian || addr.footway || '';
                  const resolvedPostcode = addr.postcode || addr.postal_code || '';
                  const resolvedCountry = addr.country || '';
                  const resolvedCountryCode = (addr.country_code || '').toUpperCase();

                  const exactGeo = {
                    latitude,
                    longitude,
                    accuracy,
                    exactAddress: data.display_name || '',
                    street: resolvedStreet,
                    neighbourhood: resolvedNeighbourhood,
                    city: resolvedCity,
                    region: resolvedRegion,
                    postcode: resolvedPostcode,
                    postalCode: resolvedPostcode,
                    country: resolvedCountry,
                    countryCode: resolvedCountryCode,
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
                } else {
                  throw new Error('Nominatim status ' + res.status);
                }
              } catch (e) {
                // If client reverse-geocode blocked by browser, send raw coordinates to backend for server-side resolution
                await api.post('/visitors/track', {
                  page: location.pathname,
                  timezone,
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
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
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
