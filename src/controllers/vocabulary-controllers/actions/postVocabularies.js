const {
  filterUndefined,
} = require("../../../services/vocabulary-services/filterUndefined");
const {
  getTaipeiTime,
} = require("../../../services/vocabulary-services/timeService");
const {
  processVocabularyTags,
} = require("../../../services/vocabulary-services/tagService");
const redisService = require("../../../services/vocabulary-services/redisService");
const mysqlService = require("../../../services/vocabulary-services/mysqlService");
const { formatResponse } = require("../../../services/vocabulary-services/responseService");

async function postVocabularies(req, res, next) {
  const { english, chinese, definition, example, tags } = req.body;

  if (!english) {
    return res.status(400).json({ message: "未加入英文單字" });
  }

  const userId = req.user.id;
  const dataField = {
    english,
    chinese,
    definition,
    example,
    userId,
    createdAt: getTaipeiTime(),
    updatedAt: getTaipeiTime(),
  };

  try {
    const mysqlField = await mysqlService.createVocabulary(filterUndefined(dataField));
    const { id: vocabularyId } = mysqlField;

    await processVocabularyTags(tags, userId, vocabularyId);

    await redisService.deleteVocabulariesFromCache(userId);
    await redisService.incrementVocabulariesCount(userId);

    res.status(200).json(formatResponse("success", userId, null, { vocabularyId }));
  } catch (error) {
    console.error("更新資料庫出現錯誤：", error);
    next(error);
  }
}

module.exports = postVocabularies;
