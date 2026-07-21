import mongoose from 'mongoose';

const citySchema = new mongoose.Schema({
  cityName: { type: String, required: true, unique: true },
  stateName: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String } // Cloudinary URL
}, {
  timestamps: true
});

export default mongoose.model('City', citySchema);
