const redisService = require("./storage/redisService");

const handleError = async (error, action, userId, next) => {
  error.message = `執行單字相關行為 ${action} 時出現錯誤: ${error.message}`;

  await redisService.pushToErrorQueue({
    action,
    userId,
    error: error.message,
  });

  next(error);
};

module.exports = {
  handleError,
};
