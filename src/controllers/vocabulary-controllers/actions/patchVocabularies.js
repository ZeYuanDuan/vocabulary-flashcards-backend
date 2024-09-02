const {
  filterUndefined,
} = require("../../../services/vocabulary-services/filterUndefined");
const {
  getTaipeiTime,
} = require("../../../services/vocabulary-services/timeService");
const {
  processVocabularyTags,
  removeVocabularyTags,
} = require("../../../services/vocabulary-services/tagService");
const redisService = require("../../../services/vocabulary-services/redisService");
const {
  updateVocabulary,
  getVocabularyById, 
} = require("../../../services/vocabulary-services/mysqlService");

async function patchVocabularies(req, res, next) {
  const { id: vocabularyId } = req.params;
  const userId = req.user.id;

  const { english, chinese, definition, example, tags } = req.body;

  const updateField = {
    english,
    chinese,
    definition,
    example,
    updatedAt: getTaipeiTime(),
  };

  try {
    const vocabulary = await getVocabularyById(vocabularyId, userId);
    if (!vocabulary) {
      return res.status(404).json({ message: `找不到單字 ID ${vocabularyId}` });
    }

    await updateVocabulary(filterUndefined(updateField), vocabularyId, userId);

    await removeVocabularyTags(vocabularyId);
    await processVocabularyTags(tags, userId, vocabularyId);

    await redisService.deleteVocabulariesFromCache(userId);

    res.status(200).json({
      message: `單字 ID ${vocabularyId} 更新成功`,
    });
  } catch (error) {
    console.error("更新資料庫出現錯誤：", error);
    next(error);
  }
}

module.exports = patchVocabularies;
