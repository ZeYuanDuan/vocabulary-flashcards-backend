const db = require("../../../models/mysql");
const { redisClient } = require("../../../models/redis");
const Vocabulary = db.Vocabulary;

const {
  filterUndefined,
} = require("../../../services/vocabulary-services/filterUndefined");
const {
  getTaipeiTime,
} = require("../../../services/vocabulary-services/timeService");
const {
  processVocabularyTags,
} = require("../../../services/vocabulary-services/tagService");

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
    const mysqlField = await Vocabulary.create(filterUndefined(dataField));
    const { id: vocabularyId } = mysqlField;

    await processVocabularyTags(tags, userId, vocabularyId);

    const userVocabulariesKey = `user:${userId}:vocabularies`;
    await redisClient.del(userVocabulariesKey);

    // * 單字總量加 1
    const userVocabulariesCountKey = `user:${userId}:vocabularies:count`;
    await redisClient.incr(userVocabulariesCountKey);

    res.status(200).json({
      message: "單字儲存成功",
      vocabularyId: vocabularyId,
    });
  } catch (error) {
    console.error("更新資料庫出現錯誤：", error);
    next(error);
  }
}

module.exports = postVocabularies;
