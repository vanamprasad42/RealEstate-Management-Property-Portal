import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import Property from '../models/propertyModel.js';
import City from '../models/cityModel.js';
import Inquiry from '../models/inquiryModel.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Property.deleteMany({});
    await City.deleteMany({});
    await Inquiry.deleteMany({});
    console.log('Cleared database...');

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@realestate.com',
      mobile: '9876543210',
      password: 'adminpassword',
      role: 'admin',
      isVerified: true
    });

    const vendor = await User.create({
      name: 'John Agent',
      email: 'vendor@realestate.com',
      mobile: '9876543211',
      password: 'vendorpassword',
      role: 'vendor',
      isVerified: true
    });

    const buyer = await User.create({
      name: 'Bob Buyer',
      email: 'buyer@realestate.com',
      mobile: '9876543212',
      password: 'buyerpassword',
      role: 'user',
      isVerified: true
    });

    console.log('Created Users...');

    // Create Cities
    const mumbai = await City.create({
      cityName: 'Mumbai',
      stateName: 'Maharashtra',
      slug: 'mumbai',
      image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    });

    const delhi = await City.create({
      cityName: 'Delhi',
      stateName: 'Delhi',
      slug: 'delhi',
      image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    });

    const bangalore = await City.create({
      cityName: 'Bangalore',
      stateName: 'Karnataka',
      slug: 'bangalore',
      image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    });

    const pune = await City.create({
      cityName: 'Pune',
      stateName: 'Maharashtra',
      slug: 'pune',
      image: 'https://images.unsplash.com/photo-1601999109332-542b18dbec57?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    });

    console.log('Created Cities...');

    // Create Properties
    await Property.create([
      {
        title: '3BHK Luxury Apartment in Bandra',
        description: 'Spectacular 3 bedroom sea view apartment in Bandra West. Features high-end modern modular kitchen, private balcony, marble flooring, and 24/7 security concierge.',
        price: 2500000,
        propertyType: 'Apartment',
        listingType: 'sale',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: 'Carter Road, Bandra West',
        latitude: 19.0664,
        longitude: 72.8225,
        bedrooms: 3,
        bathrooms: 3,
        area: 1850,
        amenities: ['Sea View', 'Gymnasium', 'Modular Kitchen', '24/7 Security', 'Power Backup'],
        images: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        vendor: vendor._id,
        status: 'available',
        approved: true
      },
      {
        title: 'Ultra Luxury 5BHK Villa in Koregaon Park',
        description: 'An architectural marvel villa with private swimming pool, landscaped lawn, home theatre setup, and double-height ceiling living room.',
        price: 85000,
        propertyType: 'Villa',
        listingType: 'rent',
        city: 'Pune',
        state: 'Maharashtra',
        address: 'Lane 5, Koregaon Park',
        latitude: 18.5362,
        longitude: 73.8930,
        bedrooms: 5,
        bathrooms: 6,
        area: 4500,
        amenities: ['Private Pool', 'Lawn', 'Home Theatre', 'Automated Gates', 'Servant Quarter'],
        images: [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        vendor: vendor._id,
        status: 'available',
        approved: true
      },
      {
        title: 'Modern 2BHK Apartment near Metro',
        description: 'Conveniently located 2 bedroom apartment. Walking distance to metro station, supermarkets, and international schools.',
        price: 1200000,
        propertyType: 'Apartment',
        listingType: 'sale',
        city: 'Delhi',
        state: 'Delhi',
        address: 'Dwarka Sector 12',
        latitude: 28.5921,
        longitude: 77.0460,
        bedrooms: 2,
        bathrooms: 2,
        area: 1100,
        amenities: ['Metro Connected', 'Lift', 'Parking', 'Gas Pipeline'],
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        vendor: vendor._id,
        status: 'available',
        approved: true
      },
      {
        title: 'Premium Residential Plot in Electronic City',
        description: 'Gated community residential plot. Clear titles, immediate registry available. Perfect investment for building a dream house.',
        price: 950000,
        propertyType: 'Plot',
        listingType: 'sale',
        city: 'Bangalore',
        state: 'Karnataka',
        address: 'Phase 1, Electronic City',
        latitude: 12.8452,
        longitude: 77.6630,
        area: 2400,
        amenities: ['Gated Community', 'Water Connection', 'Tar Roads', 'Street Lights'],
        images: [
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        vendor: vendor._id,
        status: 'available',
        approved: true
      }
    ]);

    console.log('Seeded Properties...');
    console.log('Database Seeding Successful!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error.message);
    process.exit(1);
  }
};

seedData();
