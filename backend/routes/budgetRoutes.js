import express from 'express';
import * as budgetController from '../controllers/budgetController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', budgetController.getBudgets);
router.post('/', budgetController.saveBudget);
router.delete('/:id', budgetController.deleteBudget);

export default router;
