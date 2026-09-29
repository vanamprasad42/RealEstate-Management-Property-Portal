import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import Property from '../models/propertyModel.js';
import City from '../models/cityModel.js';
import User from '../models/userModel.js';

async function seedHyderabad() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for Hyderabad data seeding...');

    // Find or create vendor
    let vendor = await User.findOne({ role: 'vendor' });
    if (!vendor) {
      vendor = await User.findOne({});
    }
    if (!vendor) {
      vendor = await User.create({
        name: 'Prime Hyderabad Realty',
        email: 'agent@hyderabadrealty.com',
        mobile: '9876543220',
        password: 'password123',
        role: 'vendor',
        isVerified: true
      });
    }

    // Upsert Hyderabad City
    let hyderabadCity = await City.findOne({ cityName: { $regex: /^hyderabad$/i } });
    if (!hyderabadCity) {
      hyderabadCity = await City.create({
        cityName: 'Hyderabad',
        stateName: 'Telangana',
        slug: 'hyderabad',
        image: 'https://images.unsplash.com/photo-1605007493699-ce65834f8a00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      });
      console.log('Created Hyderabad city entry.');
    }

    // List of properties from user mockups
    const hyderabadProperties = [
      {
        title: 'Prestige Heights',
        description: 'Spectacular 3 BHK luxury apartment located in the prime IT corridor of Gachibowli. Featuring premium vitrified tiles, modular German kitchen, East-facing balcony with panoramic skyline views, 2 covered car parks, and club-class amenities.',
        price: 7200000, // ₹72 Lakhs
        propertyType: 'Apartment',
        listingType: 'sale',
        city: 'Hyderabad',
        state: 'Telangana',
        address: 'Financial District, Gachibowli',
        latitude: 17.4401,
        longitude: 78.3489,
        bedrooms: 3,
        bathrooms: 3,
        area: 1450,
        areaUnit: 'Sq. Ft.',
        facing: 'East',
        amenities: ['Swimming Pool', 'Gymnasium', 'Clubhouse', 'Children Play Area', '24/7 Security', 'Power Backup', 'EV Charging'],
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        vendor: vendor._id,
        status: 'available',
        approved: true
      },
      {
        title: 'Lake View Residency',
        description: 'Serene 3 BHK apartment overlooking the scenic botanical surroundings of Kondapur. Ultra-spacious 8th floor unit with Italian marble flooring, false ceilings with LED cove lighting, and state-of-the-art home automation.',
        price: 7600000, // ₹76 Lakhs
        propertyType: 'Apartment',
        listingType: 'sale',
        city: 'Hyderabad',
        state: 'Telangana',
        address: 'Near Botanical Garden, Kondapur',
        latitude: 17.4682,
        longitude: 78.3615,
        bedrooms: 3,
        bathrooms: 3,
        area: 1520,
        areaUnit: 'Sq. Ft.',
        facing: 'North-East',
        amenities: ['Lake View Deck', 'Rooftop Infinity Pool', 'Squash Court', 'High Speed Elevators', 'CCTV Surveillance'],
        images: [
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        vendor: vendor._id,
        status: 'available',
        approved: true
      },
      {
        title: 'Sri Sai Enclave',
        description: 'Vastu-compliant 3 BHK premium apartment located conveniently in Miyapur, minutes from the Metro terminal. Ground floor accessibility with private sit-out garden space, dedicated solar water heating, and water softener.',
        price: 7900000, // ₹79 Lakhs
        propertyType: 'Apartment',
        listingType: 'sale',
        city: 'Hyderabad',
        state: 'Telangana',
        address: 'Near Allwyn X Roads, Miyapur',
        latitude: 17.4968,
        longitude: 78.3548,
        bedrooms: 3,
        bathrooms: 3,
        area: 1600,
        areaUnit: 'Sq. Ft.',
        facing: 'East',
        amenities: ['Private Lawn Area', 'Metro Connectivity', 'Jogging Track', 'Intercom Facility', 'Solar Backup'],
        images: [
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        vendor: vendor._id,
        status: 'available',
        approved: true
      },
      {
        title: 'Green Park Apartments',
        description: 'Modern 3 BHK unit set amidst tranquil greenery in Nallagandla. Close to top international schools and healthcare hubs. Offers open cross-ventilation, expansive French windows, and designer bath fittings.',
        price: 7500000, // ₹75 Lakhs
        propertyType: 'Apartment',
        listingType: 'sale',
        city: 'Hyderabad',
        state: 'Telangana',
        address: 'Aparna Sarovar Road, Nallagandla',
        latitude: 17.4800,
        longitude: 78.3100,
        bedrooms: 3,
        bathrooms: 3,
        area: 1480,
        areaUnit: 'Sq. Ft.',
        facing: 'North',
        amenities: ['Tennis Court', 'Banquet Hall', 'Landscaped Gardens', 'Supermarket on-premise'],
        images: [
          'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        vendor: vendor._id,
        status: 'available',
        approved: true
      },
      {
        title: 'RR Towers',
        description: 'Sophisticated 3 BHK residence in Manikonda with high rental yield potential. Features granite countertops, piped cooking gas connection, high-speed fiber internet cabling, and 100% DG backup.',
        price: 7800000, // ₹78 Lakhs
        propertyType: 'Apartment',
        listingType: 'sale',
        city: 'Hyderabad',
        state: 'Telangana',
        address: 'Puppalguda Main Road, Manikonda',
        latitude: 17.4010,
        longitude: 78.3840,
        bedrooms: 3,
        bathrooms: 3,
        area: 1550,
        areaUnit: 'Sq. Ft.',
        facing: 'West',
        amenities: ['Multi-Purpose Hall', '24hr Treated Water', 'Automated Basement Parking', 'Fire Safety Sensors'],
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        vendor: vendor._id,
        status: 'available',
        approved: true
      },
      {
        title: 'Sunrise Residency',
        description: 'Contemporary 3 BHK home in the fast-growing Tellapur hub. Wide internal roads, proximity to ORR Exit 2, premium club house membership, and children play zone.',
        price: 8000000, // ₹80 Lakhs
        propertyType: 'Apartment',
        listingType: 'sale',
        city: 'Hyderabad',
        state: 'Telangana',
        address: 'Near ORR Exit 2, Tellapur',
        latitude: 17.4720,
        longitude: 78.2950,
        bedrooms: 3,
        bathrooms: 3,
        area: 1620,
        areaUnit: 'Sq. Ft.',
        facing: 'East',
        amenities: ['Clubhouse', 'Swimming Pool', 'Badminton Court', 'Water Harvesting', '24/7 Security'],
        images: [
          'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        vendor: vendor._id,
        status: 'available',
        approved: true
      },
      {
        title: 'Royal Palms Luxury Villa',
        description: 'Exquisite 4 BHK triplex independent villa in a private gated enclave in Gachibowli. Features private plunge pool, private elevator, landscaped terrace garden, Italian modular kitchen, and double-height living room.',
        price: 22000000, // ₹2.2 Crores
        propertyType: 'Villa',
        listingType: 'sale',
        city: 'Hyderabad',
        state: 'Telangana',
        address: 'Near Wipro Circle, Gachibowli',
        latitude: 17.4350,
        longitude: 78.3420,
        bedrooms: 4,
        bathrooms: 5,
        area: 3800,
        areaUnit: 'Sq. Ft.',
        facing: 'East',
        amenities: ['Private Pool', 'Private Elevator', 'Landscaped Garden', 'Home Theatre', 'Solar Power', 'Servant Quarters'],
        images: [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        vendor: vendor._id,
        status: 'available',
        approved: true
      }
    ];

    for (const prop of hyderabadProperties) {
      const existing = await Property.findOne({ title: prop.title });
      if (!existing) {
        await Property.create(prop);
        console.log(`Created property: ${prop.title}`);
      } else {
        console.log(`Property already exists: ${prop.title}`);
      }
    }

    console.log('Finished seeding Hyderabad data successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Hyderabad properties:', error);
    process.exit(1);
  }
}

seedHyderabad();
