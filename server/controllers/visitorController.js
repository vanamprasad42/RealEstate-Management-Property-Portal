import geoip from 'geoip-lite';
import VisitorLocation from '../models/visitorLocationModel.js';

// Helper to get country name from ISO code
const getCountryName = (countryCode) => {
  if (!countryCode || countryCode === 'UN' || countryCode === 'LOCAL') return 'Unknown';
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(countryCode.toUpperCase()) || countryCode;
  } catch (e) {
    return countryCode;
  }
};

// Helper to parse client User Agent
const parseUserAgent = (uaString = '') => {
  const ua = uaString.toLowerCase();
  
  // Device
  let device = 'Desktop';
  if (/mobile|android(?!.*mobile)|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    device = 'Mobile';
  } else if (/ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))/i.test(ua)) {
    device = 'Tablet';
  } else if (/bot|crawler|spider|googlebot|bingbot|yahoo|duckduckbot/i.test(ua)) {
    device = 'Bot';
  }

  // Browser
  let browser = 'Unknown';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';

  // OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  return { device, browser, os };
};

// Reverse geocoding helper to resolve exact street, neighbourhood, and postcode from lat/lon
const reverseGeocode = async (lat, lon) => {
  if (!lat || !lon) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RealEstatePortal/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      return {
        exactAddress: data.display_name || '',
        street: addr.road || addr.street || addr.pedestrian || '',
        neighbourhood: addr.neighbourhood || addr.suburb || addr.residential || addr.subdivision || '',
        city: addr.city || addr.town || addr.village || addr.city_district || '',
        region: addr.state || addr.province || '',
        postcode: addr.postcode || '',
        country: addr.country || '',
        countryCode: (addr.country_code || '').toUpperCase()
      };
    }
  } catch (err) {
    // Fallback to BigDataCloud if Nominatim has network timeout
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const res2 = await fetch(bdcUrl);
      if (res2.ok) {
        const bdcData = await res2.json();
        const street = bdcData.localityInfo?.administrative?.[bdcData.localityInfo.administrative.length - 1]?.name || '';
        const exact = [street, bdcData.locality, bdcData.city, bdcData.principalSubdivision, bdcData.postcode, bdcData.countryName].filter(Boolean).join(', ');
        return {
          exactAddress: exact || bdcData.locality || '',
          street: street || '',
          neighbourhood: bdcData.locality || '',
          city: bdcData.city || bdcData.locality || '',
          region: bdcData.principalSubdivision || '',
          postcode: bdcData.postcode || '',
          country: bdcData.countryName || '',
          countryCode: (bdcData.countryCode || '').toUpperCase()
        };
      }
    } catch (e) {}
  }
  return null;
};

// Helper to clean IP address
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  let rawIp = forwarded ? forwarded.split(',')[0].trim() : (req.headers['x-real-ip'] || req.socket.remoteAddress || req.ip || '127.0.0.1');

  // Strip IPv6 prefix if mapped IPv4 (e.g., ::ffff:192.168.1.1 -> 192.168.1.1)
  if (rawIp.startsWith('::ffff:')) {
    rawIp = rawIp.replace('::ffff:', '');
  }
  return rawIp;
};

// Check if IP is private/loopback
const isPrivateIp = (ip) => {
  return (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip === 'localhost' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    (ip.startsWith('172.') && parseInt(ip.split('.')[1], 10) >= 16 && parseInt(ip.split('.')[1], 10) <= 31)
  );
};

// @desc    Track visitor location details and save in MongoDB
// @route   POST /api/visitors/track
// @access  Public
export const trackVisitor = async (req, res) => {
  try {
    const rawIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const { device, browser, os } = parseUserAgent(userAgent);

    const page = req.body?.page || '/';
    const referrer = req.body?.referrer || (req.headers['referer'] || 'Direct');
    const clientTimezone = req.body?.timezone || '';
    const clientCity = req.body?.clientCity || '';

    // GPS/Exact location data passed from client if available
    let clientLat = req.body?.latitude ? Number(req.body.latitude) : null;
    let clientLon = req.body?.longitude ? Number(req.body.longitude) : null;
    let clientAccuracy = req.body?.accuracy ? Number(req.body.accuracy) : null;
    let locationSource = req.body?.locationSource || (clientLat ? 'GPS (High Accuracy)' : 'IP Geolocation');

    let exactAddress = req.body?.exactAddress || '';
    let street = req.body?.street || '';
    let neighbourhood = req.body?.neighbourhood || '';
    let postcode = req.body?.postcode || req.body?.postalCode || '';

    let geo = null;
    let effectiveIp = rawIp;

    if (!isPrivateIp(rawIp)) {
      geo = geoip.lookup(rawIp);
    } else {
      // For local development, try fast WAN IP detection with timeout or provide fallback
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const ipRes = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData?.ip) {
            effectiveIp = ipData.ip;
            geo = geoip.lookup(effectiveIp);
          }
        }
      } catch (err) {
        // Fallback for offline / private network
      }
    }

    let countryCode = req.body?.countryCode || geo?.country || (isPrivateIp(rawIp) ? 'IN' : 'UN');
    let country = req.body?.country || getCountryName(countryCode);
    let region = req.body?.region || geo?.region || (isPrivateIp(rawIp) ? 'Local' : 'Unknown');
    let city = req.body?.city || geo?.city || clientCity || (isPrivateIp(rawIp) ? 'Hyderabad (Local)' : 'Unknown');
    let latitude = clientLat || ((geo?.ll && geo.ll[0]) ? geo.ll[0] : null);
    let longitude = clientLon || ((geo?.ll && geo.ll[1]) ? geo.ll[1] : null);
    let timezone = geo?.timezone || clientTimezone || 'UTC';

    // If exact address not provided by client but we have coordinates, reverse geocode now!
    if (!exactAddress && latitude && longitude) {
      const geoResolved = await reverseGeocode(latitude, longitude);
      if (geoResolved) {
        exactAddress = geoResolved.exactAddress;
        if (!street) street = geoResolved.street;
        if (!neighbourhood) neighbourhood = geoResolved.neighbourhood;
        if (!postcode) postcode = geoResolved.postcode;
        if (geoResolved.city) city = geoResolved.city;
        if (geoResolved.region) region = geoResolved.region;
        if (geoResolved.country) country = geoResolved.country;
        if (geoResolved.countryCode) countryCode = geoResolved.countryCode;
        if (locationSource === 'IP Geolocation') locationSource = 'Reverse Geocoded (IP Coordinates)';
      }
    }

    // Optional user ID if authenticated
    const userId = req.user ? req.user._id : (req.body?.userId || null);

    // Session aggregation: if same IP and device visited in the last 30 minutes, update lastVisitAt
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentVisit = await VisitorLocation.findOne({
      ip: effectiveIp,
      device,
      createdAt: { $gte: thirtyMinutesAgo }
    });

    let record;
    if (recentVisit) {
      recentVisit.visitCount += 1;
      recentVisit.lastVisitAt = new Date();
      recentVisit.page = page;
      if (exactAddress) recentVisit.exactAddress = exactAddress;
      if (street) recentVisit.street = street;
      if (neighbourhood) recentVisit.neighbourhood = neighbourhood;
      if (postcode) {
        recentVisit.postcode = postcode;
        recentVisit.postalCode = postcode;
      }
      if (latitude) recentVisit.latitude = latitude;
      if (longitude) recentVisit.longitude = longitude;
      if (locationSource) recentVisit.locationSource = locationSource;
      if (clientAccuracy) recentVisit.accuracy = clientAccuracy;
      if (userId && !recentVisit.user) recentVisit.user = userId;
      record = await recentVisit.save();
    } else {
      record = await VisitorLocation.create({
        ip: effectiveIp,
        city,
        region,
        country,
        countryCode,
        latitude,
        longitude,
        exactAddress,
        street,
        neighbourhood,
        postcode,
        postalCode: postcode,
        locationSource,
        accuracy: clientAccuracy,
        timezone,
        device,
        browser,
        os,
        userAgent,
        page,
        referrer,
        user: userId,
        visitCount: 1,
        lastVisitAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Visitor location saved successfully',
      data: {
        id: record._id,
        ip: record.ip,
        city: record.city,
        region: record.region,
        country: record.country,
        countryCode: record.countryCode,
        exactAddress: record.exactAddress,
        street: record.street,
        neighbourhood: record.neighbourhood,
        postcode: record.postcode,
        locationSource: record.locationSource,
        latitude: record.latitude,
        longitude: record.longitude,
        timezone: record.timezone,
        device: record.device,
        page: record.page
      }
    });
  } catch (error) {
    console.error('Error tracking visitor location:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get visitor location analytics / statistics
// @route   GET /api/visitors/stats
// @access  Private/Admin
export const getVisitorStats = async (req, res) => {
  try {
    const totalVisits = await VisitorLocation.countDocuments();
    const uniqueIps = await VisitorLocation.distinct('ip');

    // Aggregate by City
    const cityWise = await VisitorLocation.aggregate([
      { $group: { _id: '$city', count: { $sum: '$visitCount' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { city: '$_id', count: 1, _id: 0 } }
    ]);

    // Aggregate by Country
    const countryWise = await VisitorLocation.aggregate([
      { $group: { 
          _id: '$country', 
          code: { $first: '$countryCode' },
          count: { $sum: '$visitCount' } 
      } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { country: '$_id', code: 1, count: 1, _id: 0 } }
    ]);

    // Aggregate by Device
    const deviceWise = await VisitorLocation.aggregate([
      { $group: { _id: '$device', count: { $sum: '$visitCount' } } },
      { $project: { device: '$_id', count: 1, _id: 0 } }
    ]);

    // Aggregate by Browser
    const browserWise = await VisitorLocation.aggregate([
      { $group: { _id: '$browser', count: { $sum: '$visitCount' } } },
      { $project: { browser: '$_id', count: 1, _id: 0 } }
    ]);

    // Latest 25 visitor location records
    const recentVisitors = await VisitorLocation.find()
      .sort({ createdAt: -1 })
      .limit(25)
      .populate('user', 'name email role')
      .lean();

    res.json({
      totalVisits,
      uniqueVisitors: uniqueIps.length,
      cityWise,
      countryWise,
      deviceWise,
      browserWise,
      recentVisitors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get paginated visitor location logs
// @route   GET /api/visitors/logs
// @access  Private/Admin
export const getVisitorLogs = async (req, res) => {
  try {
    const page = Number(req.query.pageNumber) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const filter = {};

    if (req.query.country) {
      filter.country = { $regex: req.query.country, $options: 'i' };
    }
    if (req.query.city) {
      filter.city = { $regex: req.query.city, $options: 'i' };
    }
    if (req.query.device) {
      filter.device = req.query.device;
    }

    const count = await VisitorLocation.countDocuments(filter);
    const logs = await VisitorLocation.find(filter)
      .sort({ createdAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize)
      .populate('user', 'name email role')
      .lean();

    res.json({
      logs,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
