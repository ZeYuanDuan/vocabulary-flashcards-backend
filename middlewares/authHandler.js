const passport = require("../config/passport")

module.exports = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      // 如果用戶未登入，回傳自定義錯誤訊息
      return res.status(401).json({
        message: "請先登入",
      });
    }
    // 如果驗證成功，將用戶信息掛載到req對象上，並繼續執行後續中間件
    req.user = user;
    next();
  })(req, res, next);
};

// module.exports = (req, res, next) => {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.status(401).json({
//     message: "請先登入",
//   });
// };
