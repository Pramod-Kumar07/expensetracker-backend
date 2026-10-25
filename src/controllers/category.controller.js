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

module.exports = { createCategory };
