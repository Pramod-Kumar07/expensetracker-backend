const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const {
  getDashboardSummary,
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getRecentTransactions,
} = require("../controllers/dashboard.controller");

const router = express.Router();

router.use(authenticate);

router.get("/summary", getDashboardSummary);
router.get("/monthly", getMonthlyAnalytics);
router.get("/categories", getCategoryAnalytics);
router.get("/recent", getRecentTransactions);

module.exports = router;
