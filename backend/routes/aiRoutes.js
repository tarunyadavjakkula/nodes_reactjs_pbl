import express from 'express';
import * as aiController from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/chat', aiController.chat);
router.get('/context', aiController.getContext);

export default router;

