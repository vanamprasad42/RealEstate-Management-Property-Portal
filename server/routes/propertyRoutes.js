import express from 'express';
import { 
  getProperties, 
  getPropertyById, 
  createProperty, 
  updateProperty, 
  deleteProperty 
} from '../controllers/propertyController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProperties)
  .post(protect, authorizeRoles('user', 'vendor', 'admin'), createProperty);

router.route('/:id')
  .get(getPropertyById)
  .put(protect, authorizeRoles('user', 'vendor', 'admin'), updateProperty)
  .delete(protect, authorizeRoles('user', 'vendor', 'admin'), deleteProperty);

export default router;
