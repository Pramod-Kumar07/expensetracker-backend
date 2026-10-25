const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
  createExpense,
  getAllExpense,
} = require("../controllers/expense.controller");

router.use(authenticate);
router.post("/", createExpense);
router.get("/", getAllExpense);

module.exports = router;
