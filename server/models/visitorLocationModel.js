import mongoose from 'mongoose';
import './userModel.js';

const visitorLocationSchema = new mongoose.Schema({
  ip: { 
    type: String, 
    required: true,
    trim: true 
  },
  city: { 
    type: String, 
    default: 'Unknown',
    trim: true 
  },
  region: { 
    type: String, 
    default: 'Unknown', // State or Province
    trim: true 
  },
  country: { 
    type: String, 
    default: 'Unknown',
    trim: true 
  },
  countryCode: { 
    type: String, 
    default: 'UN',
    trim: true,
    uppercase: true 
  },
  latitude: { 
    type: Number, 
    default: null 
  },
  longitude: { 
    type: Number, 
    default: null 
  },
  exactAddress: { 
    type: String, 
    default: '',
    trim: true 
  },
  street: { 
    type: String, 
    default: '',
    trim: true 
  },
  neighbourhood: { 
    type: String, 
    default: '',
    trim: true 
  },
  postalCode: { 
    type: String, 
    default: '',
    trim: true 
  },
  postcode: { 
    type: String, 
    default: '',
    trim: true 
  },
  locationSource: { 
    type: String, 
    default: 'IP Geolocation' // 'GPS (High Accuracy)', 'Reverse Geocoded', 'IP Geolocation'
  },
  accuracy: { 
    type: Number, 
    default: null // GPS accuracy radius in meters
  },
  timezone: { 
    type: String, 
    default: '' 
  },
  isp: { 
    type: String, 
    default: '' 
  },
  device: { 
    type: String, 
    enum: ['Desktop', 'Mobile', 'Tablet', 'Bot', 'Unknown'],
    default: 'Desktop' 
  },
  browser: { 
    type: String, 
    default: 'Unknown' 
  },
  os: { 
    type: String, 
    default: 'Unknown' 
  },
  userAgent: { 
    type: String, 
    default: '' 
  },
  page: { 
    type: String, 
    default: '/' 
  },
  referrer: { 
    type: String, 
    default: 'Direct' 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null 
  },
  visitCount: { 
    type: Number, 
    default: 1 
  },
  lastVisitAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

// Indexes for ultra-fast analytics, filtering, and queries
visitorLocationSchema.index({ createdAt: -1 });
visitorLocationSchema.index({ ip: 1 });
visitorLocationSchema.index({ city: 1 });
visitorLocationSchema.index({ country: 1 });
visitorLocationSchema.index({ device: 1 });

export default mongoose.model('VisitorLocation', visitorLocationSchema);
