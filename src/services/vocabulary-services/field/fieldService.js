// * 整理單字資料結構

function createDataField({ english, chinese, definition, example, userId }) {
  return {
    english,
    chinese,
    definition,
    example,
    userId,
  };
}

function createUpdateField({ english, chinese, definition, example }) {
  return {
    english,
    chinese,
    definition,
    example,
  };
}

module.exports = {
  createDataField,
  createUpdateField,
};
