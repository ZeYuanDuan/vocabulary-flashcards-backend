const express = require("express");
const passport = require("../../config/auth/passport.js");
const authController = require("../../controllers/auth-controller.js");

const router = express.Router();

router.post("/local", authController.postLogin);
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);
router.get("/google/callback", authController.getGoogleAuthCallback);

module.exports = router;
