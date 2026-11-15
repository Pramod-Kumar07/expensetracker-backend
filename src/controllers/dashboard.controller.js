const prisma = require("../../config/db");

const getMonthRange = (year, month) => {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));
  return {
    startDate,
    endDate,
  };
};

const toNumber = (val) => {
  return val ? Number(val.toString()) : 0;
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const { endDate, startDate } = getMonthRange(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
    );
    const [allTime, currentMonth] = await Promise.all([
      prisma.expense.groupBy({
        by: ["type"],
        where: {
          userId: req.user.id,
        },
        _sum: { amount: true },
      }),

      prisma.expense.groupBy({
        by: ["type"],
        where: {
          userId: req.user.id,
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const getTotals = (records) => {
      const income = records.find((e) => e.type === "INCOME");
      const expense = records.find((e) => e.type === "EXPENSE");

      const totleIncome = toNumber(income?._sum?.amount);
      const totleExpense = toNumber(expense?._sum?.amount);
      return {
        totleIncome,
        totleExpense,
        balance: totleIncome - totleExpense,
      };
    };

    return res.status(200).json({
      status: 200,
      message: "Summary fetched successfully.",
      data: {
        allTime: getTotals(allTime),
        currentMonth: getTotals(currentMonth),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const now = new Date();

    const startDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
    );

    const lastDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const transactions = await prisma.expense.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        amount: true,
        type: true,
        date: true,
      },
    });

    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
      );
      monthlyData.push({
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        label: date.toLocaleString("en-US", {
          month: "short",
          timeZone: "UTC",
        }),
        income: 0,
        expense: 0,
      });
    }

    const monthMap = new Map(
      monthlyData.map((e) => [`${e.year}-${e.month}`, e]),
    );

    for (const transaction of transactions) {
      const date = new Date(transaction.date);
      const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;

      const month = monthMap.get(key);
      if (month) {
        if (transaction.type === "INCOME") {
          month.income += toNumber(transaction.amount);
        } else {
          month.expense += toNumber(transaction.amount);
        }
      }
    }

    return res.status(200).json({
      status: 200,
      message: "Montly analytics for last 5 months.",
      data: monthlyData,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryAnalytics = async (req, res, next) => {
  try {
    const categoryTotals = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        userId: req.user.id,
        type: "EXPENSE",
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
    });

    const categories = await prisma.category.findMany({
      where: {
        userId: req.user.id,
        id: {
          in: categoryTotals.map((e) => e.categoryId),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const categoryMap = new Map(categories.map((e) => [e.id, e.name]));

    const data = categoryTotals.map((e) => {
      return {
        categoryId: e.categoryId,
        categoryName: categoryMap.get(e.categoryId),
        total: toNumber(e?._sum.amount),
      };
    });

    const totalExpense = data.reduce((sum, item) => sum + item.total, 0);
    const result = data.map((item) => {
      return {
        ...item,
        percentage:
          totalExpense > 0
            ? Number(((item.total / totalExpense) * 100).toFixed(2))
            : 0,
      };
    });

    return res.status(200).json({
      status: 200,
      message: "Category analytics.",
      data: {
        totalExpense,
        categories: result,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getRecentTransactions = async (req, res, next) => {
  try {
    const transactions = await prisma.expense.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        date: "desc",
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        date: true,
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
      message: "Recent transacrions.",
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getRecentTransactions,
};
