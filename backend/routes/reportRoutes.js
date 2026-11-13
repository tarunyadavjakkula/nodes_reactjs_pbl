import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', reportController.getReport);
router.get('/export-csv', reportController.exportCsv);

export default router;
