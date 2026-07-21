import City from '../models/cityModel.js';
import Property from '../models/propertyModel.js';

// @desc    Fetch all cities
// @route   GET /api/cities
// @access  Public
export const getCities = async (req, res) => {
  try {
    const cities = await City.find({});
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch properties by city slug
// @route   GET /api/cities/:slug/properties
// @access  Public
export const getCityProperties = async (req, res) => {
  try {
    const city = await City.findOne({ slug: req.params.slug });
    
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    const pageSize = 12;
    const page = Number(req.query.pageNumber) || 1;

    const count = await Property.countDocuments({ city: city.cityName, approved: true });
    const properties = await Property.find({ city: city.cityName, approved: true })
      .populate('vendor', 'name email')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({ properties, city, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a city
// @route   POST /api/cities
// @access  Private/Admin
export const createCity = async (req, res) => {
  try {
    const { cityName, stateName, slug, image } = req.body;
    const cityExists = await City.findOne({ slug });

    if (cityExists) {
      return res.status(400).json({ message: 'City already exists' });
    }

    const city = await City.create({
      cityName,
      stateName,
      slug,
      image
    });

    res.status(201).json(city);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a city
// @route   DELETE /api/cities/:id
// @access  Private/Admin
export const deleteCity = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (city) {
      await City.deleteOne({ _id: city._id });
      res.json({ message: 'City removed' });
    } else {
      res.status(404).json({ message: 'City not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
