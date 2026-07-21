import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  propertyType: { type: String, required: true }, // e.g., Apartment, Villa, Plot
  listingType: { type: String, enum: ['sale', 'rent'], required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  address: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  area: { type: Number, required: true },
  areaUnit: { type: String }, // Sq. Yards, Sq. Ft., Acres, Cents, Gunta
  plotLength: { type: Number },
  plotWidth: { type: Number },
  facing: { type: String }, // East, West, North, South
  cornerPlot: { type: Boolean },
  roadWidth: { type: Number },
  plotType: { type: String }, // Residential Plot, Commercial Plot, Farm Land, etc.
  amenities: [{ type: String }],
  images: [{ type: String }], // Cloudinary URLs
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['available', 'sold', 'rented'], default: 'available' },
  approved: { type: Boolean, default: false },
  slug: { type: String, unique: true }
}, {
  timestamps: true
});

// Generate SEO-friendly slug before save
propertySchema.pre('save', async function() {
  if (!this.isModified('title') && this.slug) {
    return;
  }
  
  let generatedSlug = this.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
    
  const citySlug = this.city ? this.city.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') : '';
  const typeSlug = this.propertyType ? this.propertyType.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') : '';
  
  if (typeSlug) generatedSlug += `-${typeSlug}`;
  if (citySlug) generatedSlug += `-${citySlug}`;
  
  // Make unique
  const Property = mongoose.model('Property');
  let slugExists = await Property.findOne({ slug: generatedSlug });
  let uniqueSlug = generatedSlug;
  while (slugExists && slugExists._id.toString() !== this._id.toString()) {
    uniqueSlug = `${generatedSlug}-${Math.random().toString(36).substring(2, 6)}`;
    slugExists = await Property.findOne({ slug: uniqueSlug });
  }
  this.slug = uniqueSlug;
});

export default mongoose.model('Property', propertySchema);
