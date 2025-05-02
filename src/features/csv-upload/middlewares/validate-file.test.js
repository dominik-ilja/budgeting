const { MIME_TYPES } = require("../../../constants/mime-types");
const { isValidCsvFile, validateFile } = require("./validate-file");

/**@returns {Express.Multer.File} */
function createMockFile(mimetype = "") {
  return { mimetype };
}

describe("isValidCsvFile", () => {
  test.each([null, "abc", 100, createMockFile("application/json")])("Detects invalid files: %s", (file) => {
    const result = isValidCsvFile(file);

    expect(result).toBe(false);
  });
  test("Detects valid files", () => {
    const file = createMockFile(MIME_TYPES.CSV);

    const result = isValidCsvFile(file);

    expect(result).toBe(true);
  });
});

describe("validateFile middleware", () => {
  /**@returns {import("express").Request} */
  function createMockRequest(file = undefined, mapping = undefined) {
    return {
      file,
      body: {
        mapping,
      },
    };
  }
  /**@returns {import("express").Response} */
  function createMockResponse() {
    return {
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  }

  let res = createMockResponse();
  let next = jest.fn();

  beforeEach(() => {
    res = createMockResponse();
    next = jest.fn();
  });

  test.each([null, createMockFile("application/json")])(
    "Returns a 400 status code when invalid files are passed: %s",
    (file) => {
      req = createMockRequest(file);

      validateFile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("No CSV file was included");
    }
  );

  test("Returns a 400 status code when no mapping is included", () => {
    const file = createMockFile();
    const mapping = "";
    req = createMockRequest(file, mapping);

    validateFile(req, res, next);

    expect();
  });

  test("Calls the next middleware for valid requests", () => {
    const file = createMockFile(MIME_TYPES.CSV);
    const mapping = "CHASE_CHECKINGS";
    req = createMockRequest(file, mapping);

    validateFile(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
