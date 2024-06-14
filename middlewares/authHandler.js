module.exports = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  // const message = req.flash("error");
  // res.json({
  //   message: message.length > 0 ? message[0] : "請先登入",
  // });
  res.json({
    message: "請先登入",
  });
};
