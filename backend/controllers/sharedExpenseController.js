import * as sharedExpenseService from '../services/sharedExpenseService.js';
import { successResponse } from '../utils/responseHandler.js';

export const getGroups = async (req, res, next) => {
  try {
    const groups = await sharedExpenseService.getGroups(req.user.id);
    return successResponse(res, 'Groups fetched successfully', groups);
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    const group = await sharedExpenseService.createGroup(req.user.id, req.body);
    return successResponse(res, 'Group created successfully', group, 201);
  } catch (error) {
    next(error);
  }
};

export const getGroupDetails = async (req, res, next) => {
  try {
    const details = await sharedExpenseService.getGroupDetails(req.user.id, req.params.id);
    return successResponse(res, 'Group details fetched successfully', details);
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const member = await sharedExpenseService.addMember(req.user.id, req.params.id, req.body);
    return successResponse(res, 'Member added successfully', member, 201);
  } catch (error) {
    next(error);
  }
};

export const addExpense = async (req, res, next) => {
  try {
    const result = await sharedExpenseService.addExpense(req.user.id, req.params.id, req.body);
    return successResponse(res, 'Expense added and split calculated successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const result = await sharedExpenseService.deleteExpense(req.user.id, req.params.id, req.params.expenseId);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    const result = await sharedExpenseService.deleteGroup(req.user.id, req.params.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

