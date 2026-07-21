import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../server/models/userModel.js';

dotenv.config({ path: '../server/.env' });

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/realestate');
    console.log('Connected to DB');
    const user = await User.findOne({ email: 'vendor@realestate.com' });
    console.log('User:', user);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
