import * as aiService from '../services/aiService.js';
import { successResponse } from '../utils/responseHandler.js';

export const chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const result = await aiService.chatWithAssistant(req.user.id, message, history);
    return successResponse(res, 'AI response generated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getContext = async (req, res, next) => {
  try {
    const context = await aiService.getFinancialContext(req.user.id);
    return successResponse(res, 'Financial context retrieved successfully', context);
  } catch (error) {
    next(error);
  }
};

