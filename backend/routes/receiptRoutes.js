import express from 'express';
import * as receiptController from '../controllers/receiptController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/scan', receiptController.scanReceipt);

export default router;

