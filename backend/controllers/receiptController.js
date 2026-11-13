import * as receiptService from '../services/receiptService.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export const scanReceipt = async (req, res, next) => {
  try {
    const { text } = req.body;
    
    // Support either direct text payload (e.g. from client OCR) or receipt text
    const parsed = receiptService.parseReceiptText(text || '');
    return successResponse(res, 'Receipt analyzed and parsed successfully', parsed);
  } catch (error) {
    next(error);
  }
};

