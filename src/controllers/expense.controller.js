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

const getAllExpense = async (req, res, next) => {
  try {
    const {
      type,
      categoryId,
      startDate,
      endDate,
      page = "1",
      limit = "10",
    } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      !Number.isInteger(pageSize) ||
      pageNumber < 1 ||
      pageSize < 1
    ) {
      return res.status(400).json({
        status: 400,
        message: "Invalid page number or size.",
      });
    }

    if (type && !["INCOME", "EXPENSE"].includes(type)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid transaction type.",
      });
    }

    const validDate = (date) =>
      typeof date === "string" && !Number.isNaN(Date.parse(date));
    if (
      (startDate && !validDate(startDate)) ||
      (endDate && !validDate(endDate))
    ) {
      return res.status(400).json({
        status: 400,
        message: "Invalid date filter",
      });
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        status: 400,
        message: "Start date must be before end date.",
      });
    }

    const where = {
      userId: req.user.id,
      ...(type && { type }),
      ...(categoryId && { categoryId }),
      ...((startDate || endDate) && {
        date: {
          ...(startDate && {
            gte: new Date(startDate),
          }),
          ...(endDate && {
            lte: new Date(endDate),
          }),
        },
      }),
    };
    const [expenses, total] = await prisma.$transaction([
      prisma.expense.findMany({
        where,
        orderBy: {
          date: "desc",
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return res.status(200).json({
      status: 200,
      message: "",
      data: expenses,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!expense) {
      return res.status(404).json({
        status: 404,
        message: "Transaction not found.",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Transaction found.",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const { amount, type, description, date, categoryId } = req.body;

    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existingExpense) {
      return res.status(404).json({
        status: 404,
        message: "Expense not found.",
      });
    }

    const updateData = {};
    if (amount !== undefined) {
      const amountString = String(amount);
      if (
        !/^\d{1,10}(\.\d{1,2})?$/.test(amountString) ||
        Number(amountString) <= 0
      ) {
        return res.status(400).json({
          status: 400,
          message: "Amount must be positive and atmost 2 decimal places.",
        });
      }
      updateData.amount = amountString;
    }

    if (type !== undefined) {
      if (!["ICOME", "EXPENSE"].includes(type)) {
        return res.status(400).json({
          status: 400,
          message: "Type must be ICOME or EXPENSE",
        });
      }
      updateData.type = type;
    }

    if (description !== undefined) {
      if (
        description !== null &&
        (typeof description !== "string" || description.length > 500)
      ) {
        return res.status(400).json({
          status: 400,
          message: "Description must be a string of atmost 500 characters.",
        });
      }
      updateData.description = description?.trim() || null;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (!date || Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          status: 400,
          message: "Invalid date.",
        });
      }
      updateData.date = parsedDate;
    }

    if (categoryId !== undefined) {
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
      updateData.categoryId = categoryId;
    }

    if (Object.keys(updateData).length == 0) {
      return res.status(400).json({
        status: 400,
        message: "Noting to update.",
      });
    }

    const updatedExpense = await prisma.expense.update({
      where: {
        id: existingExpense.id,
      },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Expense updated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const deletedExpense = await prisma.expense.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (deletedExpense.count == 0) {
      return res.status(400).json({
        status: 400,
        message: "Expense not found.",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Expense deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getAllExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
