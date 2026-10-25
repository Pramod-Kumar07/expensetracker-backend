const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { createExpense } = require("../controllers/expense.controller");

router.use(authenticate);
router.post("/", createExpense);

module.exports = router;
