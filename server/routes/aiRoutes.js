import express from 'express';
import {
  chatWithAi,
  getRecentQueries,
  getPreferences,
  updatePreferences,
  getAiRecommendations
} from '../controllers/aiController.js';

const router = express.Router();

router.post('/chat', chatWithAi);
router.get('/recent-queries', getRecentQueries);
router.get('/preferences', getPreferences);
router.post('/preferences', updatePreferences);
router.get('/recommendations', getAiRecommendations);

export default router;
