import express from 'express';
import { 
  createInquiry, 
  getVendorInquiries, 
  updateInquiryStatus 
} from '../controllers/inquiryController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createInquiry);

router.route('/vendor')
  .get(protect, authorizeRoles('vendor', 'admin'), getVendorInquiries);

router.route('/:id')
  .put(protect, authorizeRoles('vendor', 'admin'), updateInquiryStatus);

export default router;
