import express from 'express';
import { 
  getUsers, 
  getVendors, 
  approveProperty, 
  blockUser,
  deleteUser,
  getReports
} from '../controllers/adminController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('admin'));

router.get('/users', getUsers);
router.get('/vendors', getVendors);
router.put('/property-approval/:id', approveProperty);
router.put('/users/:id/block', blockUser);
router.delete('/users/:id', deleteUser);
router.get('/reports', getReports);

export default router;
