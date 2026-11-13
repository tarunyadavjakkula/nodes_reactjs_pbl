import * as authService from '../services/authService.js';
import { validateRegisterInput, validateLoginInput } from '../validators/authValidator.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export const register = async (req, res, next) => {
  try {
    const { isValid, errors } = validateRegisterInput(req.body);
    if (!isValid) {
      return errorResponse(res, 'Validation error', 400, errors);
    }

    const result = await authService.registerUser(req.body);
    return successResponse(res, 'User registered successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { isValid, errors } = validateLoginInput(req.body);
    if (!isValid) {
      return errorResponse(res, 'Validation error', 400, errors);
    }

    const result = await authService.loginUser(req.body);
    return successResponse(res, 'Login successful', result, 200);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user.id);
    return successResponse(res, 'User profile fetched successfully', profile, 200);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updated = await authService.updateUserProfile(req.user.id, req.body);
    return successResponse(res, 'Profile updated successfully', updated, 200);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required.', 400);
    }
    const result = await authService.changeUserPassword(req.user.id, { currentPassword, newPassword });
    return successResponse(res, result.message, null, 200);
  } catch (error) {
    next(error);
  }
};

