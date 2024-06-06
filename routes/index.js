const express = require("express");
const router = express.Router();

const db = require("../models");
const User = db.User;
const Vocabulary = db.Vocabulary;

const authHandler = require("../middlewares/authHandler");
const passport = require("../config/passport");

router.use("/vocabularies", authHandler, require("./vocabularies"));
router.use("/users", require("./users"));

router.get("/", (req, res) => {
  res.send("Hello world");
  console.log("Hello world");
});

router.get("/login", (req, res) => {
  // 回傳 Vocabulary 資料庫
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (req, res) => {
    // 回傳使用者名稱和 vocabulary 資料庫長度。
    try {
      const name = req.user.name;
      const userID = req.user.id;
      const vocStorage = await Vocabulary.count({
        where: { userID },
      });
      return res.json({ name, vocStorage });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// router.get("/register", (req, res) => {
//   // 渲染註冊頁面，前端工作
// });

router.post("/logout", (req, res) => {
  // 執行登出程序
  req.logout((error) => {
    if (error) {
      return res.status(500).json({ message: "Server error" });
    }
    // 回傳成功訊息給前端
    return res.status(200).json({ message: "登出成功" });
  });
});

module.exports = router;
