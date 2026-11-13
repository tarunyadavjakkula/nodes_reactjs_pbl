import * as notificationService from '../services/notificationService.js';
import { successResponse } from '../utils/responseHandler.js';

export const getNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getNotifications(req.user.id);
    return successResponse(res, 'Notifications retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.user.id, req.params.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(req.user.id, req.params.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};
