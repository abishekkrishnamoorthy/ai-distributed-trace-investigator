const jwt = require("jsonwebtoken");
const { AppError } = require("../middleware/error.middleware");

const getAuthConfig = () => {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET } = process.env;
  const expiresIn = process.env.JWT_EXPIRES_IN || "1h";

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !JWT_SECRET) {
    throw new AppError("Authentication is not configured", 500);
  }

  return {
    adminUsername: ADMIN_USERNAME,
    adminPassword: ADMIN_PASSWORD,
    jwtSecret: JWT_SECRET,
    expiresIn
  };
};

const login = (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const { adminUsername, adminPassword, jwtSecret, expiresIn } = getAuthConfig();

    if (!username || !password) {
      throw new AppError("Username and password are required", 400);
    }

    if (username !== adminUsername || password !== adminPassword) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = jwt.sign({ username: adminUsername }, jwtSecret, { expiresIn });

    res.json({
      data: {
        token,
        expiresIn,
        user: {
          username: adminUsername
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login
};
