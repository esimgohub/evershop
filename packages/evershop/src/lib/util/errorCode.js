/**
 * Error codes used throughout the application.
 * @enum {string}
 */
const ERROR_CODE = {
  INVALID_PAYLOAD: 'PAYLOAD_001',
  INVALID_COUPON: 'COUPON_001',
  INTERNAL_ERROR: 'INTERNAL_001'
};

/**
 * Error messages corresponding to the error codes.
 * @type {Object<string, string>}
 */
const ERROR_MSG = {
  [ERROR_CODE.INVALID_PAYLOAD]: 'Bad Request',
  [ERROR_CODE.INVALID_COUPON]: 'Invalid Coupon',
  [ERROR_CODE.INTERNAL_ERROR]: 'Internal Error'
};

/**
 * Maps an error code to its corresponding message. If the error code is not found,
 * it defaults to the internal error code and message.
 *
 * @param {string} errorCode - The error code to map.
 * @returns {{ errorCode: string, message: string }} An object containing the error code and message.
 */
const errorCodeMapper = (errorCode) => {
  if (!ERROR_MSG[errorCode]) {
    return {
      errorCode: ERROR_CODE.INTERNAL_ERROR,
      message: ERROR_MSG[ERROR_CODE.INTERNAL_ERROR]
    };
  }
  return {
    errorCode,
    message: ERROR_MSG[errorCode]
  };
};

module.exports = {
  ERROR_CODE,
  ERROR_MSG,
  errorCodeMapper
};
