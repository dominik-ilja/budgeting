const { MIME_TYPES } = require("../../../constants/mime-types");

/**
 * @description Validates if a request has the required attributes for processing a CSV file. The request is expected to be in a multipart format.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
function validateFile(req, res, next) {
  if (!isValidCsvFile(req.file)) {
    return res.status(400).send("No CSV file was included");
  }
  if (req.body.mapping == null) {
    return res.status(400).send('No CSV "mapping" was included');
  }

  next();
}

/**
 * @param {Express.Multer.File} file
 */
function isValidCsvFile(file) {
  return !!file && file?.mimetype === MIME_TYPES.CSV;
}

module.exports = { isValidCsvFile, validateFile };
