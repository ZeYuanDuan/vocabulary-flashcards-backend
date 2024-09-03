const bcrypt = require("bcryptjs");
const db = require("../models/mysql");
const { User, Local_User } = db;
const {
  handleValidationError,
} = require("../services/user-services/handleValidationError");
const redisService = require("../services/vocabulary-services/storage/redisService");
const mysqlService = require("../services/vocabulary-services/storage/mysqlService");

const userControllers = {
  registerLocalUser: async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;
    try {
      if (!name || !email || !password || !confirmPassword) {
        handleValidationError(res, "所有欄位都是必填");
      }

      if (password.length < 3 || password.length > 20) {
        handleValidationError(res, "密碼長度需介於 3 到 20 個字元之間");
      }

      if (password !== confirmPassword) {
        handleValidationError(res, "密碼與確認密碼不符");
      }

      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        handleValidationError(res, "請輸入正確的 email 格式");
      }

      if (!name.length || name.length > 50) {
        handleValidationError(res, "名稱長度需少於 50 個字元");
      }
    } catch (error) {
      return next(error);
    }

    try {
      const existedUser = await Local_User.findOne({ where: { email } });
      if (existedUser) {
        handleValidationError(res, "此 Email 已被註冊");
      }
    } catch (error) {
      return next(error);
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await User.create({ name }).then((user) =>
        Local_User.create({
          email,
          password: hashedPassword,
          userId: user.id,
        })
      );

      return res.status(200).json({ message: "註冊成功" });
    } catch (error) {
      return next(error);
    }
  },

  getUserStatistics: async (req, res, next) => {
    try {
      const { name, id: userId } = req.user;

      const vocabulariesCount = await mysqlService.countVocabularies(userId);
      await redisService.setVocabulariesCount(userId, vocabulariesCount);
      return res.json({ name, vocStorage: vocabulariesCount });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = userControllers;
