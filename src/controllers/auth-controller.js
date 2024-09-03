const passport = require("passport");
const { handleAuthResult } = require("../services/auth-services");

const createAuthHandler = (strategy) => (req, res, next) => {
  passport.authenticate(strategy, (err, user, info) =>
    handleAuthResult(err, user, info, res, next)
  )(req, res, next);
};

const authControllers = {
  authenticateLocalLogin: createAuthHandler("local"),
  handleGoogleAuthCallback: createAuthHandler("google"),
};

module.exports = authControllers;
