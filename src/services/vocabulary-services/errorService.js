const redisService = require("./redisService");

const handleError = async (error, action, userId, next) => {
  console.error(`顯示 Redis 單字資料出現錯誤: ${error.message}`);
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
