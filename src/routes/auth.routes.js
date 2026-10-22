const express = require("express");
const {
  register,
  login,
  getme,
  refresh,
  logout,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", authenticate, getme);
router.post("/logout", logout);

module.exports = router;
