const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

const router = express.Router();

router.use(authenticate);
router.route("/").post(createCategory).get(getCategories);
router.route("/:id").patch(updateCategory).delete(deleteCategory);

module.exports = router;
