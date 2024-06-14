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



router.post("/login", async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    return req.login(user, async (err) => {
      if (err) {
        return next(err);
      }
      try {
        const { name, id } = user;
        const message = info.message;
        const vocStorage = await Vocabulary.count({
          where: { UserId: id },
        });
        return res.json({ message, name, vocStorage });
      } catch (err) {
        next(err);
      }
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

router.get("/", authHandler, async (req, res, next) => {
  try {
    const { name, id } = req.user;
    const vocStorage = await Vocabulary.count({
      where: { UserId: id },
    });
    return res.json({ name, vocStorage });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
