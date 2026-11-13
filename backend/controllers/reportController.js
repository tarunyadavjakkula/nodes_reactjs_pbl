import * as reportService from '../services/reportService.js';
import { successResponse } from '../utils/responseHandler.js';

export const getReport = async (req, res, next) => {
  try {
    const data = await reportService.generateReportData(req.user.id, req.query);
    return successResponse(res, 'Report generated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const exportCsv = async (req, res, next) => {
  try {
    const csvContent = await reportService.generateCsvContent(req.user.id, req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="spendwise-report-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
