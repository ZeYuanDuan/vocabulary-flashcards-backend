const express = require("express");
const passport = require("../config/auth/passport.js");

const vocabulariesRouter = require("./vocabularies.js");
const usersRouter = require("./users.js");

const homeController = require("../controllers/home-controller.js");
const authController = require("../controllers/auth-controller.js");

const authHandler = require("../middlewares/authHandler.js");
const cron = require("node-cron");

const router = express.Router();

// 路由設置
router.use("/vocabularies", authHandler, vocabulariesRouter);
router.use("/users", usersRouter);

router.post("/login", authController.postLogin);
router.get("/", authHandler, homeController.getHomePage);
router.get("/daily", homeController.getDailyVocabularies);

// Google OAuth 路由
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);
router.get("/auth/google/callback", authController.getGoogleAuthCallback);

// 定時任務
setupCronJobs();

// 測試和開發路由
if (process.env.NODE_ENV !== "production") {
  setupDevRoutes();
}

module.exports = router;

// 輔助函數
function setupCronJobs() {
  // 收集明日的每日單字
  // ! 注意 Render 伺服器正在運行，多伺服器執行此任務會有衝突
  cron.schedule(
    "10 00 * * *",
    async () => {
      await homeController.fetchAndStoreVocabularies();
      await homeController.fetchVocabulariesDetail();
      console.log("明日單字已準備完畢");
    },
    {
      scheduled: true,
      timezone: "Asia/Taipei",
    }
  );

  // 更新每日單字
  // ! 注意 Render 伺服器正在運行，多伺服器執行此任務會有衝突
  cron.schedule(
    "00 00 * * *",
    async () => {
      await homeController.updateDailyVocabularies();
      console.log("每日單字已更新完畢");
    },
    {
      scheduled: true,
      timezone: "Asia/Taipei",
    }
  );
}

function setupDevRoutes() {
  // Google OAuth 測試頁面
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
}
