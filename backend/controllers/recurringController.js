import * as recurringService from '../services/recurringService.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export const getRecurring = async (req, res, next) => {
  try {
    const list = await recurringService.getRecurringTransactions(req.user.id);
    return successResponse(res, 'Recurring transactions fetched', list);
  } catch (error) {
    next(error);
  }
};

export const createRecurring = async (req, res, next) => {
  try {
    const item = await recurringService.createRecurringTransaction(req.user.id, req.body);
    return successResponse(res, 'Recurring transaction created', item, 201);
  } catch (error) {
    next(error);
  }
};

export const updateRecurring = async (req, res, next) => {
  try {
    const item = await recurringService.updateRecurringTransaction(req.user.id, req.params.id, req.body);
    return successResponse(res, 'Recurring transaction updated', item);
  } catch (error) {
    next(error);
  }
};

export const deleteRecurring = async (req, res, next) => {
  try {
    const result = await recurringService.deleteRecurringTransaction(req.user.id, req.params.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

export const processDue = async (req, res, next) => {
  try {
    const result = await recurringService.processDueRecurringTransactions(req.user.id);
    return successResponse(res, 'Due recurring transactions processed successfully', result);
  } catch (error) {
    next(error);
  }
};
