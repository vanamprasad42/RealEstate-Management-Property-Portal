import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'contacted', 'closed'], default: 'pending' }
}, {
  timestamps: true
});

export default mongoose.model('Inquiry', inquirySchema);
