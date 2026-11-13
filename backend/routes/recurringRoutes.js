import express from 'express';
import * as recurringController from '../controllers/recurringController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', recurringController.getRecurring);
router.post('/', recurringController.createRecurring);
router.post('/process-due', recurringController.processDue);
router.put('/:id', recurringController.updateRecurring);
router.delete('/:id', recurringController.deleteRecurring);

export default router;
