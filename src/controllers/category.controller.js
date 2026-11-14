const prisma = require("../../config/db");

const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        status: 400,
        message: "Category name is required.",
      });
    }
    const categoryName = name.trim();

    const existingCategory = await prisma.category.findUnique({
      where: {
        name_userId: {
          name: categoryName,
          userId: req.user.id,
        },
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        status: 400,
        message: "Category already exists.",
      });
    }

    const category = await prisma.category.create({
      data: {
        name: categoryName,
        userId: req.user.id,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Category added successfully.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            expenses: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        status: 400,
        message: "Category name is required.",
      });
    }

    const categoryName = name;
    if (categoryName.length > 50) {
      return res.status(400).json({
        status: 400,
        message: "Category name can not exceed 50 characters.",
      });
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingCategory) {
      return res.status(404).json({
        status: 404,
        message: "Category not found.",
      });
    }

    const updatedCategory = await prisma.category.update({
      where: {
        id,
      },
      data: {
        name: categoryName,
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Category updated successfully.",
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!category) {
      return res.status(404).json({
        status: 404,
        message: "Category not found.",
      });
    }

    const expenseCount = await prisma.expense.count({
      where: {
        categoryId: id,
        userId: req.user.id,
      },
    });

    if (expenseCount > 0) {
      return res.status(400).json({
        status: 400,
        message: "Can not delete category with existing transactions.",
        data: {
          expenseCount,
        },
      });
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      status: 200,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
