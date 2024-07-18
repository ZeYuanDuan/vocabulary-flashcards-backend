const express = require("express");
const router = express.Router();
const passport = require("../config/passport");

const { performance } = require("perf_hooks"); // ! 測試用

const vocabularies = require("./vocabularies");
const users = require("./users");

const homeController = require("../controllers/home-controller");
const authController = require("../controllers/auth-controller");

const {
  verifyRedisDataWithMySQL,
  syncVocabulariesToRedis,
} = require("../middlewares/dataHandler");

const authHandler = require("../middlewares/authHandler");
const cron = require("node-cron");

router.use("/vocabularies", authHandler, vocabularies);
router.use("/users", users);

router.post("/login", authController.postLogin);

router.get("/", authHandler, homeController.getHomePage);

router.get("/daily", homeController.getDailyVocabularies);

// TODO 收集明日的每日單字
cron.schedule("10 00 * * *", async () => {
  await homeController.fetchAndStoreVocabularies();
  await homeController.fetchVocabulariesDetail();
  console.log("明日單字已準備完畢");
});

// TODO 一天開始時，將已經準備好的單字，存到 Redis 的今日單字
cron.schedule("00 00 * * *", async () => {
  await homeController.updateDailyVocabularies();
  console.log("每日單字已更新完畢");
});

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get("/auth/google/callback", authController.getGoogleAuthCallback);

// ===========================

router.get("/sync", authHandler, async (req, res, next) => {
  syncVocabulariesToRedis(req.user.id);
}); // ! 測試用

router.get("/verify", authHandler, async (req, res, next) => {
  verifyRedisDataWithMySQL(req.user.id);
}); // ! 測試用

const db = require("../models/mysql");
const Vocabulary = db.Vocabulary;

router.get("/mysql", authHandler, async (req, res, next) => {
  try {
    const start = performance.now(); // ! 測試用
    const vocabularies = await Vocabulary.findAll({
      where: { userId: req.user.id },
    });
    const end = performance.now(); // ! 測試用
    res.json(vocabularies);
    console.log(`MySQL 讀取耗時: ${end - start} ms`);
  } catch (error) {
    next(error);
  }
});

// ! 測試 Google OAuth2.0 頁面
router.get("/test/auth/google", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Google OAuth Test</title>
    </head>
    <body>
      <h1>Google OAuth 2.0 Test</h1>
      <a href="/auth/google">Login with Google</a>
      <form id="logout-form" action="/logout" method="POST" style="display: none;">
        <input type="submit" value="Logout">
      </form>
      <a href="#" onclick="document.getElementById('logout-form').submit(); return false;">Logout</a>
      <h1>Vocabulary Form</h1>
    <form action="/vocabularies" method="POST">
        <div>
            <label for="english">English:</label>
            <input type="text" id="english" name="english" required>
        </div>
        <div>
            <label for="chinese">Chinese:</label>
            <input type="text" id="chinese" name="chinese">
        </div>
        <div>
            <label for="definition">Definition:</label>
            <textarea id="definition" name="definition"></textarea>
        </div>
        <div>
            <label for="example">Example:</label>
            <textarea id="example" name="example"></textarea>
        </div>
        <div>
            <button type="submit">Submit</button>
        </div>
    </form>
    </body>
    </html>
  `);
});

module.exports = router;
