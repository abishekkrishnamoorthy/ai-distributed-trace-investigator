const jwt = require("jsonwebtoken");
const { AppError } = require("./error.middleware");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");

    if (!authHeader) {
      throw new AppError("Unauthorized", 401);
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError("Unauthorized", 401);
    }

    if (!process.env.JWT_SECRET) {
      throw new AppError("Authentication is not configured", 500);
    }

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      next(new AppError("Unauthorized", 401));
      return;
    }

    next(error);
  }
};

module.exports = {
  authenticate
};
