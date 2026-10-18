const ApiError = require('../utils/apiError');

/**
 * Restrict access to specific user roles
 * @param {Array<string>|string} allowedRoles
 */
const authorize = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access forbidden: requires one of the roles [${roles.join(', ')}]`
        )
      );
    }

    next();
  };
};

module.exports = {
  authorize
};
