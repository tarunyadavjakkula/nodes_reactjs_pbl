import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/category-breakdown', analyticsController.getCategoryBreakdown);
router.get('/monthly-trends', analyticsController.getMonthlyTrends);
router.get('/daily-trends', analyticsController.getDailyTrends);
router.get('/insights', analyticsController.getInsights);

export default router;
