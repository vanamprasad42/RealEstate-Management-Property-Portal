import Property from '../models/propertyModel.js';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

// @desc    Fetch all properties
// @route   GET /api/properties
// @access  Public
export const getProperties = async (req, res) => {
  try {
    const pageSize = req.query.pageSize === 'all' ? 0 : (Number(req.query.pageSize) || Number(req.query.limit) || 12);
    const page = Number(req.query.pageNumber) || 1;
    
    // Build query based on filters
    const query = {};

    if (req.query.vendorId) {
      query.vendor = req.query.vendorId;
    }

    if (req.query.approved === 'false') {
      query.approved = false;
    } else if (req.query.approved === 'true') {
      query.approved = true;
    } else if (req.query.approved === 'all') {
      // Return both approved and unapproved
    } else if (!req.query.vendorId) {
      // Default public behavior
      query.approved = true;
    }
    
    if (req.query.keyword) {
      query.$or = [
        { title: { $regex: req.query.keyword, $options: 'i' } },
        { address: { $regex: req.query.keyword, $options: 'i' } },
        { city: { $regex: req.query.keyword, $options: 'i' } },
        { state: { $regex: req.query.keyword, $options: 'i' } }
      ];
    }
    
    if (req.query.city) query.city = { $regex: `^${req.query.city}$`, $options: 'i' };
    if (req.query.propertyType) query.propertyType = req.query.propertyType;
    if (req.query.listingType) query.listingType = req.query.listingType;
    
    if (req.query.propertyType !== 'Plot') {
      if (req.query.bedrooms) query.bedrooms = { $gte: Number(req.query.bedrooms) };
      if (req.query.bathrooms) query.bathrooms = { $gte: Number(req.query.bathrooms) };
    } else {
      if (req.query.areaUnit) query.areaUnit = req.query.areaUnit;
      if (req.query.facing) query.facing = req.query.facing;
      if (req.query.cornerPlot) query.cornerPlot = req.query.cornerPlot === 'true';
      if (req.query.plotType) query.plotType = req.query.plotType;
      if (req.query.roadWidth) query.roadWidth = { $gte: Number(req.query.roadWidth) };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    const count = await Property.countDocuments(query);
    let propertyQuery = Property.find(query)
      .populate('vendor', 'name email mobile')
      .sort({ createdAt: -1 });

    if (pageSize > 0) {
      propertyQuery = propertyQuery.limit(pageSize).skip(pageSize * (page - 1));
    }

    const properties = await propertyQuery;
    const totalPages = pageSize > 0 ? Math.ceil(count / pageSize) : 1;

    res.json({ properties, page, pages: totalPages, total: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single property
// @route   GET /api/properties/:id
// @access  Public
export const getPropertyById = async (req, res) => {
  try {
    const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: req.params.id } : { slug: req.params.id };
    
    const property = await Property.findOne(query).populate('vendor', 'name email mobile');
    if (property) {
      if (!property.approved) {
        let isAuthorized = false;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
          try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user && (user.role === 'admin' || user._id.toString() === property.vendor._id.toString())) {
              isAuthorized = true;
            }
          } catch (e) {
            // Invalid token
          }
        }
        if (!isAuthorized) {
          return res.status(403).json({ message: 'This property listing is pending admin verification and is not published on the webpage yet.' });
        }
      }
      res.json(property);
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a property
// @route   POST /api/properties
// @access  Private/Vendor
export const createProperty = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const property = new Property({
      ...req.body,
      vendor: req.user._id,
      approved: isAdmin ? (req.body.approved ?? true) : false // Requires admin approval before publishing
    });

    const createdProperty = await property.save();
    res.status(201).json(createdProperty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a property
// @route   PUT /api/properties/:id
// @access  Private/Vendor
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (property) {
      // Check if user is the vendor or admin
      if (property.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Not authorized to update this property' });
      }

      Object.assign(property, req.body);
      
      // If user or vendor updates, reset approval so admin re-verifies before publishing
      if (req.user.role !== 'admin') {
        property.approved = false; 
      }

      const updatedProperty = await property.save();
      res.json(updatedProperty);
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a property
// @route   DELETE /api/properties/:id
// @access  Private/Vendor or Admin
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (property) {
      if (property.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Not authorized to delete this property' });
      }

      await Property.deleteOne({ _id: property._id });
      res.json({ message: 'Property removed' });
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
