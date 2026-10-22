const prisma = require("../../config/db");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/token");
const { hasToken, getRefreshTokenExpiry } = require("../utils/refreshToken");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Name, email or password is missing.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existingUser) {
      return res.status(400).json({
        status: 400,
        message: "User already exists.",
      });
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      staus: 201,
      message: "User added successfully.",
      data: user,
    });
  } catch (err) {
    return res.status(400).json({
      staus: 400,
      message: err.message || "Something went wrong!",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Email and Password are mandatory.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        status: 401,
        message: "Invalid email or password",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        status: 401,
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const tokenHash = hasToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    res.cookie("refreshtoken", refreshToken, {
      httponly: true,
      secure: process.env.NODE_ENV == "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      status: 200,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        accessToken,
      },
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error.message || "Something went wrong!",
    });
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshtoken;

    if (!refreshToken) {
      return res.status(401).json({
        status: 401,
        message: "Refresh token not found.",
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        status: 401,
        message: "Invalid or expired refresh token.",
      });
    }

    const tokenHash = hasToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!storedToken) {
      return res.status(401).json({
        status: 401,
        message: "Refresh token has been revoked.",
      });
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: {
          id: storedToken.id,
        },
      });

      return res.status(401).json({
        status: 401,
        message: "Refresh token has expired",
      });
    }

    if (storedToken.userId !== decoded.userId) {
      return res.status(401).json({
        status: 401,
        message: "Invalid refresh token.",
      });
    }

    const newAccessToken = generateAccessToken(storedToken.userId);
    const newRefreshToken = generateRefreshToken(storedToken.userId);

    const newTokenHash = hasToken(newRefreshToken);

    await prisma.$transaction([
      prisma.refreshToken.delete({
        where: {
          id: storedToken.id,
        },
      }),
      prisma.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId: storedToken.userId,
          expiresAt: getRefreshTokenExpiry(),
        },
      }),
    ]);

    res.cookie("refreshtoken", newRefreshToken, {
      httponly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      status: 200,
      message: "Token refreshed successfully.",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getme = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshtoken;
    if (refreshToken) {
      const tokenHash = hasToken(refreshToken);
      await prisma.refreshToken.deleteMany({
        where: {
          tokenHash,
        },
      });
    }
    res.clearCookie("refreshtoken", {
      httponly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      status: 200,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, getme, logout };
