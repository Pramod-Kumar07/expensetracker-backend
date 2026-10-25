const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const { createCategory } = require("../controllers/category.controller");

const router = express.Router();

router.use(authenticate);
router.post("/", createCategory);

module.exports = router;
