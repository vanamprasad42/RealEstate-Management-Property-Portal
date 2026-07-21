import Inquiry from '../models/inquiryModel.js';
import Property from '../models/propertyModel.js';

// @desc    Create a new inquiry
// @route   POST /api/inquiries
// @access  Private
export const createInquiry = async (req, res) => {
  try {
    const { propertyId, message } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const inquiry = await Inquiry.create({
      user: req.user._id,
      property: propertyId,
      vendor: property.vendor,
      message,
      status: 'pending'
    });

    res.status(201).json(inquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inquiries for vendor
// @route   GET /api/inquiries/vendor
// @access  Private/Vendor
export const getVendorInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ vendor: req.user._id })
      .populate('property', 'title price city slug')
      .populate('user', 'name email mobile')
      .sort({ createdAt: -1 });

    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update inquiry status
// @route   PUT /api/inquiries/:id
// @access  Private/Vendor
export const updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // Verify vendor ownership
    if (inquiry.vendor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this inquiry' });
    }

    inquiry.status = status; // pending, contacted, closed
    const updatedInquiry = await inquiry.save();

    res.json(updatedInquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
