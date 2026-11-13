import * as categoryService from '../services/categoryService.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export const getAllCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const categories = await categoryService.getCategories(req.user.id, type);
    return successResponse(res, 'Categories retrieved successfully', categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const newCategory = await categoryService.createCategory(req.user.id, req.body);
    return successResponse(res, 'Category created successfully', newCategory, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const updated = await categoryService.updateCategory(req.user.id, req.params.id, req.body);
    return successResponse(res, 'Category updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const result = await categoryService.deleteCategory(req.user.id, req.params.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};
