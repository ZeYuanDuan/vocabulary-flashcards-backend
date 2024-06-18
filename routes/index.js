const express = require("express");
const router = express.Router();

const vocabularies = require("./vocabularies");
const users = require("./users");

const homeController = require("../controllers/home-controller");
const authController = require("../controllers/auth-controller");

const authHandler = require("../middlewares/authHandler");

router.use("/vocabularies", authHandler, vocabularies);
router.use("/users", users);


router.post("/login", authController.postLogin);
router.post("/logout", authController.postLogout);
router.get("/", authHandler, homeController.getHomePage);

router.get("/auth/google", authController.getGoogleAuth);
router.get("/auth/google/callback", authController.getGoogleAuthCallback);


// 測試 Google OAuth2.0 頁面
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
    </body>
    </html>
  `)
})

module.exports = router;
