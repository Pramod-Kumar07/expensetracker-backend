const crypto = require("crypto");

const hasToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const getRefreshTokenExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return expiresAt;
};

module.exports = {
  hasToken,
  getRefreshTokenExpiry,
};
