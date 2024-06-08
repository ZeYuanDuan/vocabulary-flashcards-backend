const express = require("express");
const router = express.Router();

const passport = require("passport");

const db = require("../models");
const Vocabulary = db.Vocabulary;

const vocabularies = require("./vocabularies");
const users = require("./users");
const authHandler = require("../middlewares/authHandler");

router.use("/vocabularies", authHandler, vocabularies);
router.use("/users", users);

router.get("/", authHandler, async (req, res, next) => {
  try {
    const { name, id } = req.user;
    const message = req.flash("success");
    const vocStorage = await Vocabulary.count({
      where: { UserId: id },
    });
    return res.json({ message, name, vocStorage });
  } catch (error) {
    next(error);
  }
});

router.get("/login", (req, res) => {
  const message = req.flash("error");
  res.json({
    message: message.length > 0 ? message[0] : "請先登入",
  });
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("error", info.message);
      return res.redirect("back");
    }
    return req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", info.message);
      return res.redirect("/");
    });
  })(req, res, next);
});

router.post("/logout", (req, res) => {
  req.logout((error) => {
    if (error) {
      return next(error);
    }
    return res.status(200).json({ message: "登出成功" });
  });
});

module.exports = router;
