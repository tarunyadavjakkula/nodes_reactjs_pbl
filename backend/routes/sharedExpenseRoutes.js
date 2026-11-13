import express from 'express';
import * as sharedExpenseController from '../controllers/sharedExpenseController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', sharedExpenseController.getGroups);
router.post('/', sharedExpenseController.createGroup);
router.get('/:id', sharedExpenseController.getGroupDetails);
router.delete('/:id', sharedExpenseController.deleteGroup);
router.post('/:id/members', sharedExpenseController.addMember);
router.post('/:id/expenses', sharedExpenseController.addExpense);
router.delete('/:id/expenses/:expenseId', sharedExpenseController.deleteExpense);

export default router;

