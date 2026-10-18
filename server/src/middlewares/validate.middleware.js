const ApiError = require('../utils/apiError');

/**
 * Middleware factory to validate request against Joi schema
 * @param {Object} schema - Object containing Joi schemas for body, query, and/or params
 */
const validate = (schema) => (req, res, next) => {
  const validationTargets = ['params', 'query', 'body'];

  for (const target of validationTargets) {
    if (schema[target]) {
      const { error, value } = schema[target].validate(req[target], {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        return next(ApiError.badRequest(errorMessage));
      }

      req[target] = value;
    }
  }

  next();
};

module.exports = validate;
