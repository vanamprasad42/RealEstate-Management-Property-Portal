import express from 'express';
import { getCities, getCityProperties, createCity, deleteCity } from '../controllers/cityController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getCities)
  .post(protect, authorizeRoles('admin'), createCity);

router.route('/:slug/properties').get(getCityProperties);

router.route('/:id')
  .delete(protect, authorizeRoles('admin'), deleteCity);

export default router;
