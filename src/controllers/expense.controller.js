const prisma = require("../../config/db");

const createExpense = async (req, res, next) => {
  try {
    const { amount, type, date, categoryId, description } = req.body;
    if (
      amount == undefined ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        status: 400,
        message: "Amount must be positive.",
      });
    }

    if (!["EXPENSE", "INCOME"].includes(type)) {
      return res.status(400).json({
        status: 400,
        message: "Type must be INCOME or EXPENSE.",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        status: 400,
        message: "Category is required.",
      });
    }

    if (
      date !== undefined &&
      (typeof date !== "string" || Number.isNaN(Date.parse(date)))
    ) {
      return res.status(400).json({
        status: 400,
        message: "Invalid date.",
      });
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: req.user.id,
      },
    });

    if (!category) {
      return res.status(400).json({
        status: 400,
        message: "Invalid category.",
      });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: Number(amount).toFixed(2),
        type,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        userId: req.user.id,
        categoryId,
      },
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        date: true,
        categoryId: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Expense added successfully.",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createExpense };
