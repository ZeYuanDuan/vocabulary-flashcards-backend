const bcrypt = require("bcryptjs");
const db = require("../models/mysql");
const { redisClient } = require("../models/redis");
const { User, Local_User, Vocabulary } = db;

const userControllers = {
  registerLocalUser: async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;
    try {
      if (!name || !email || !password || !confirmPassword) {
        res.status(400).json({ message: "所有欄位都是必填" });
        return res.redirect("back");
      }

      if (password.length < 3 || password.length > 20) {
        res.status(400).json({ message: "密碼長度需介於 3 到 20 個字元之間" });
        return res.redirect("back");
      }

      if (password !== confirmPassword) {
        res.status(400).json({ message: "密碼與確認密碼不符" });
        return res.redirect("back");
      }

      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        res.status(400).json({ message: "請輸入正確的 email 格式" });
        return res.redirect("back");
      }

      if (!name.length || name.length > 50) {
        res.status(400).json({ message: "名稱長度需少於 50 個字元" });
        return res.redirect("back");
      }
    } catch (error) {
      return next(error);
    }

    try {
      const existedUser = await Local_User.findOne({ where: { email } });
      if (existedUser) {
        return res.status(400).json({ message: "此 Email 已被註冊" });
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
      const { name, id } = req.user;

      const userVocabulariesCountKey = `user:${id}:vocabularies:count`;
      const vocabulariesCount = await Vocabulary.count({
        where: { userId: id },
      });
      await redisClient.set(
        userVocabulariesCountKey,
        vocabulariesCount,
        "EX",
        3600
      );
      return res.json({ name, vocStorage: vocabulariesCount });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = userControllers;
