const redisService = require("./storage/redisService");

const handleError = async (error, action, key, dataField, next) => {
  console.error(`Error in action ${action}: ${error.message}`);
  await redisService.pushToErrorQueue(action, key, dataField, error);
  next(error);
};

module.exports = {
  handleError,
};
