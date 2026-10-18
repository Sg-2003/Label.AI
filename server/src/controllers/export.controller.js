const asyncHandler = require('../utils/asyncHandler');
const exportService = require('../services/export.service');
const ApiError = require('../utils/apiError');

const exportDataset = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const format = (req.query.format || 'json').toLowerCase();
  const completedOnly = req.query.completedOnly !== 'false';

  if (format === 'csv') {
    const csvContent = await exportService.exportToCSV(projectId, completedOnly);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="project_${projectId}_export.csv"`
    );
    return res.status(200).send(csvContent);
  } else if (format === 'json') {
    const jsonContent = await exportService.exportToJSON(projectId, completedOnly);
    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="project_${projectId}_export.json"`
      );
    }
    return res.status(200).json({
      success: true,
      data: jsonContent
    });
  } else {
    throw ApiError.badRequest('Unsupported format. Please choose "json" or "csv".');
  }
});

module.exports = {
  exportDataset
};
