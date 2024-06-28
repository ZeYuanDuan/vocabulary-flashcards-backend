const passport = require("../config/passport")

module.exports = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        message: "請先登入",
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

