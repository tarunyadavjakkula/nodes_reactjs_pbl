import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { errorResponse } from '../utils/responseHandler.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return errorResponse(res, 'Access denied. No authentication token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'spendwise_secret_key');
    
    // Check if user still exists in database
    const [rows] = await pool.query('SELECT id, name, email, currency, theme FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      return errorResponse(res, 'User account no longer exists. Please re-authenticate.', 401);
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Authentication token has expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid authentication token.', 403);
  }
};

