import * as goalService from '../services/goalService.js';
import { successResponse } from '../utils/responseHandler.js';

export const getGoals = async (req, res, next) => {
  try {
    const goals = await goalService.getGoals(req.user.id);
    return successResponse(res, 'Savings goals retrieved successfully', goals);
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req, res, next) => {
  try {
    const goal = await goalService.createGoal(req.user.id, req.body);
    return successResponse(res, 'Savings goal created successfully', goal, 201);
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const updated = await goalService.updateGoal(req.user.id, req.params.id, req.body);
    return successResponse(res, 'Savings goal updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const contributeToGoal = async (req, res, next) => {
  try {
    const result = await goalService.contributeToGoal(req.user.id, req.params.id, req.body.amount);
    return successResponse(res, 'Funds contributed to goal successfully', result);
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const result = await goalService.deleteGoal(req.user.id, req.params.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

