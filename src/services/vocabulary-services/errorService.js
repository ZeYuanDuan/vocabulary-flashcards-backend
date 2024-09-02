// * 處理錯誤
const redisService = require("./storage/redisService");

const handleError = async (error, action, userId, next) => {
  console.error(`單字 CURD 出現錯誤: ${error.message}`);
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
