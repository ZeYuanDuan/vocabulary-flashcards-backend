// * 錯誤處理邏輯
const redisService = require("./storage/redisService");

const handleError = async (error, action, key, dataField, next) => {
  error.message = `執行公開行為 ${action} 時出現錯誤: ${error.message}`;

  await redisService.pushToErrorQueue(action, key, dataField, error);

  next(error);
};

module.exports = {
  handleError,
};
