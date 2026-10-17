import express from 'express';
import { 
  getProperties, 
  getPropertyById, 
  createProperty, 
  updateProperty, 
  deleteProperty 
} from '../controllers/propertyController.js';
import { protect, optionalProtect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(optionalProtect, getProperties)
  .post(protect, authorizeRoles('user', 'vendor', 'admin'), createProperty);

router.route('/:id')
  .get(getPropertyById)
  .put(protect, authorizeRoles('user', 'vendor', 'admin'), updateProperty)
  .delete(protect, authorizeRoles('user', 'vendor', 'admin'), deleteProperty);

export default router;
