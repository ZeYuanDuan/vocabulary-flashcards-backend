const { getTaipeiTime } = require("./timeService");

function createDataField({ english, chinese, definition, example, userId }) {
  const currentTime = getTaipeiTime();
  return {
    english,
    chinese,
    definition,
    example,
    userId,
    createdAt: currentTime,
    updatedAt: currentTime,
  };
}

function createUpdateField({ english, chinese, definition, example }) {
  return {
    english,
    chinese,
    definition,
    example,
    updatedAt: getTaipeiTime(),
  };
}

module.exports = {
  createDataField,
  createUpdateField,
};
