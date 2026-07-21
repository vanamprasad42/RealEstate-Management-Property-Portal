import User from '../models/userModel.js';
import Property from '../models/propertyModel.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all vendors
// @route   GET /api/admin/vendors
// @access  Private/Admin
export const getVendors = async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).select('-password');
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Reject property listing
// @route   PUT /api/admin/property-approval/:id
// @access  Private/Admin
export const approveProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (property) {
      property.approved = req.body.approved; // true or false
      const updatedProperty = await property.save();
      res.json(updatedProperty);
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block/Unblock User
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
export const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.isBlocked = !user.isBlocked;
      const updatedUser = await user.save();
      res.json({ message: user.isBlocked ? 'User blocked' : 'User unblocked', user: updatedUser });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User account deleted' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard reports / analytics
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getReports = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const totalListings = await Property.countDocuments({});
    const activeListings = await Property.countDocuments({ approved: true });
    const pendingListings = await Property.countDocuments({ approved: false });

    // City-Wise listing stats
    const cityWise = await Property.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $project: { city: '$_id', count: 1, _id: 0 } }
    ]);

    // Simple revenue stats (mock data or based on hypothetical vendor subscriptions)
    const revenue = {
      totalRevenue: totalVendors * 49, // assuming $49 subscription per vendor
      subscriptionRate: 49,
      formattedRevenue: `$${totalVendors * 49}`
    };

    res.json({
      totalUsers,
      totalVendors,
      totalListings,
      activeListings,
      pendingListings,
      cityWise,
      revenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
