const express = require("express");
const passport = require("../../config/auth/passport.js");
const authController = require("../../controllers/auth-controller.js");

const router = express.Router();

router.post("/local", authController.authenticateLocalLogin);
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);
router.get("/google/callback", authController.handleGoogleAuthCallback);

setupDevRoutes(); // ! 測試用

function setupDevRoutes() {
  // Google OAuth 測試頁面
  router.get("/test/google", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google OAuth Test</title>
      </head>
      <body>
        <h1>Google OAuth 2.0 Test</h1>
        <a href="/api/v1/auth/google">Login with Google</a>
        <form id="logout-form" action="/api/v1/auth/logout" method="POST" style="display: none;">
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

module.exports = router;
