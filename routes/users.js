const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");

const db = require("../models");
const { UPDATE } = require("sequelize/lib/query-types");
const User = db.User;

router.post("/users", async (req, res) => {
  const { name, email, password } = req.body;

  // 使用者成功送出表單，確認表單資料
  if (!name || !email || !password) {
    return res.status(400).json({ message: "所有欄位都是必填" });
  } else if (name.length < 5 || name.length > 12) {
    return res
      .status(400)
      .json({ message: "名稱長度需介於 5 到 12 個字元之間" });
  } else if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ message: "請輸入正確的 email 格式" });
  } else if (password.length < 3 || password.length > 20) {
    return res
      .status(400)
      .json({ message: "密碼長度需介於 3 到 20 個字元之間" });
  }

  // 確認該 Email 是否註冊過
  const existedUser = await User.findOne({ where: { email } });
  if (existedUser) {
    return res.status(400).json({ message: "此 Email 已被註冊" });
  }
  // 將使用者資料傳入資料庫，回傳成功訊息
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return res.status(201).json({ message: "註冊成功" });
});

module.exports = router;
