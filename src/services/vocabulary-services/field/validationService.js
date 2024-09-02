// * 驗證資料正確性
function validateVocabularyExistence(vocabulary, vocabularyId, res) {
  if (!vocabulary) {
    res.status(404).json({ message: `找不到單字 ID ${vocabularyId}` });
    return false;
  }
  return true;
}

function validateEnglishField(english, res) {
  if (!english) {
    res.status(400).json({ message: "未加入英文單字" });
    return false;
  }
  return true;
}

module.exports = {
  validateVocabularyExistence,
  validateEnglishField,
};
