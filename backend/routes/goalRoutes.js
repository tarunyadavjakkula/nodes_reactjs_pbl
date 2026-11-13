import express from 'express';
import * as goalController from '../controllers/goalController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', goalController.getGoals);
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.patch('/:id/contribute', goalController.contributeToGoal);
router.delete('/:id', goalController.deleteGoal);

export default router;

