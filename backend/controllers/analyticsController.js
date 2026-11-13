import * as analyticsService from '../services/analyticsService.js';
import * as insightsService from '../services/insightsService.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const data = await analyticsService.getCategoryBreakdown(req.user.id, req.query);
    return successResponse(res, 'Category breakdown calculated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getMonthlyTrends = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months || '6', 10);
    const data = await analyticsService.getMonthlyTrends(req.user.id, months);
    return successResponse(res, 'Monthly trends calculated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getDailyTrends = async (req, res, next) => {
  try {
    const data = await analyticsService.getDailySpendingTrends(req.user.id, req.query.month);
    return successResponse(res, 'Daily spending trends calculated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getInsights = async (req, res, next) => {
  try {
    const data = await insightsService.getSmartFinancialInsights(req.user.id, req.query.month);
    return successResponse(res, 'Smart financial insights generated', data);
  } catch (error) {
    next(error);
  }
};
