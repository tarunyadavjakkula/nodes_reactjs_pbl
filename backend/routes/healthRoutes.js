import express from 'express';
import { testConnection } from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  
  const statusData = {
    status: 'ONLINE',
    app: 'SpendWise API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  };

  if (dbStatus.success) {
    return successResponse(res, 'SpendWise backend is operational and database connected.', statusData);
  } else {
    return res.status(503).json({
      success: false,
      message: 'SpendWise backend running, but database connection failed.',
      data: statusData,
    });
  }
});

export default router;

