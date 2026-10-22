const { verifyAccessToken } = require("../utils/token");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: 401,
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyAccessToken(token);

    req.user = {
      id: decoded.userId,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      status: 401,
      message: error.message || "Unauthorized!",
    });
  }
};

module.exports = { authenticate };
