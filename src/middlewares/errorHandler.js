module.exports = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: "Server error", error: err.message });
};
