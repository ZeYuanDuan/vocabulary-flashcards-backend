const handleValidationError = (res, message) => {
  res.status(400).json({ message });
  return res.redirect("back");
};

module.exports = { handleValidationError };

