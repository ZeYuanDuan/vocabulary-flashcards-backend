const db = require("../../models/mysql");
const { Vocabulary, User } = db;
const jwt = require("jsonwebtoken");

const JWT_EXPIRATION = "7d";

const generateTokenAndUserInfo = async (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("未定義 JWT_SECRET");
  }

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
  const { id, name } = await User.findByPk(userId);
  const vocStorage = await Vocabulary.count({ where: { userId: id } });

  return { token, name, vocStorage };
};

const handleAuthResult = async (err, user, info, res, next) => {
  if (err) {
    return next(err);
  }

  if (!user) {
    const error = new Error(info?.error_message || "驗證失敗");
    error.statusCode = 401;
    return next(error);
  }

  try {
    const { token, name, vocStorage } = await generateTokenAndUserInfo(
      user.userId
    );
    res.json({
      message: info.success_message,
      name,
      vocStorage,
      isAuthenticated: true,
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateTokenAndUserInfo,
  handleAuthResult,
};
