import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { connectDB } from '../config/db.js';
import VisitorLocation from '../models/visitorLocationModel.js';

const viewVisitors = async () => {
  try {
    await connectDB();
    console.log('\n======================================================');
    console.log('       VISITOR LOCATION TELEMETRY (MONGODB)           ');
    console.log('======================================================\n');

    const total = await VisitorLocation.countDocuments();
    const uniqueIps = await VisitorLocation.distinct('ip');

    console.log(`Total Visits: ${total} | Unique IPs: ${uniqueIps.length}\n`);

    if (total === 0) {
      console.log('No visitor records found yet.');
      console.log('Browse the website at http://localhost:5173 to generate visits!\n');
      process.exit(0);
    }

    const visitors = await VisitorLocation.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const formatted = visitors.map(v => ({
      IP: v.ip,
      'Exact Address': v.exactAddress || `${v.city}, ${v.region}, ${v.country}`,
      Street: v.street || 'N/A',
      Area: v.neighbourhood || 'N/A',
      Postcode: v.postcode || v.postalCode || 'N/A',
      City: v.city,
      Region: v.region,
      Country: `${v.country} (${v.countryCode})`,
      Source: v.locationSource || 'IP Geolocation',
      Device: `${v.device} (${v.browser}/${v.os})`,
      Page: v.page,
      Hits: v.visitCount,
      'Last Visit': new Date(v.lastVisitAt || v.createdAt).toLocaleString()
    }));

    console.table(formatted);
    console.log('\n======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('Error fetching visitor records:', error);
    process.exit(1);
  }
};

viewVisitors();
