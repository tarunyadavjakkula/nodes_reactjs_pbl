import * as budgetService from '../services/budgetService.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export const getBudgets = async (req, res, next) => {
  try {
    const { month } = req.query;
    const result = await budgetService.getBudgets(req.user.id, month);
    return successResponse(res, 'Budgets fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const saveBudget = async (req, res, next) => {
  try {
    const saved = await budgetService.createOrUpdateBudget(req.user.id, req.body);
    return successResponse(res, 'Budget saved successfully', saved, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req, res, next) => {
  try {
    const result = await budgetService.deleteBudget(req.user.id, req.params.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};
