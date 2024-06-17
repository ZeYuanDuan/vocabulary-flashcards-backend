module.exports = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.json({
    message: "請先登入",
  });
};
