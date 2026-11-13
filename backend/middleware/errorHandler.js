import { errorResponse } from '../utils/responseHandler.js';

export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url} - ${err.message}`);
  
  if (err.name === 'ValidationError') {
    return errorResponse(res, err.message, 400, err.errors);
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return errorResponse(res, 'A record with that unique value already exists.', 409);
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return errorResponse(res, 'Referenced record does not exist.', 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : (process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message);

  return errorResponse(res, message, statusCode);
};

