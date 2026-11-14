const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
  createExpense,
  getAllExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require("../controllers/expense.controller");

router.use(authenticate);
// router.post("/", createExpense);
// router.get("/", getAllExpense);

router.route("/").post(createExpense).get(getAllExpense);
router
  .route("/:id")
  .get(getExpenseById)
  .patch(updateExpense)
  .delete(deleteExpense);

module.exports = router;
