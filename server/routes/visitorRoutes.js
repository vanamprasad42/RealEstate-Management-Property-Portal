import express from 'express';
import { 
  trackVisitor, 
  getVisitorStats, 
  getVisitorLogs 
} from '../controllers/visitorController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public endpoint to track visitor location
router.post('/track', trackVisitor);

// Protected admin endpoints for analytics and logs
router.get('/stats', protect, authorizeRoles('admin'), getVisitorStats);
router.get('/logs', protect, authorizeRoles('admin'), getVisitorLogs);

export default router;
