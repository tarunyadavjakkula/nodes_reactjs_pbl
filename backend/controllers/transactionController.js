import * as transactionService from '../services/transactionService.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export const getTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.getTransactions(req.user.id, req.query);
    return successResponse(res, 'Transactions retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const tx = await transactionService.getTransactionById(req.user.id, req.params.id);
    return successResponse(res, 'Transaction fetched successfully', tx);
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const created = await transactionService.createTransaction(req.user.id, req.body);
    return successResponse(res, 'Transaction created successfully', created, 201);
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const updated = await transactionService.updateTransaction(req.user.id, req.params.id, req.body);
    return successResponse(res, 'Transaction updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const result = await transactionService.deleteTransaction(req.user.id, req.params.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

export const getFinancialSummary = async (req, res, next) => {
  try {
    const summary = await transactionService.getFinancialSummary(req.user.id, req.query);
    return successResponse(res, 'Financial summary calculated successfully', summary);
  } catch (error) {
    next(error);
  }
};
