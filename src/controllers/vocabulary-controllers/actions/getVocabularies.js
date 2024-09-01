const db = require("../../../models/mysql");
const Vocabulary = db.Vocabulary;
const Tag = db.Tag;
const Vocabulary_Tag = db.Vocabulary_Tag;

const redisService = require("../../../services/vocabulary-services/redisService");
const {
  USER_TAG_PREFIX,
  NO_TAG_NAME,
} = require("../../../services/vocabulary-services/tagService");

async function getVocabularies(req, res, next) {
  const userId = req.user.id;

  try {
    let results = [];

    const cachedVocabularies = await redisService.getVocabulariesFromCache(
      userId
    );

    if (cachedVocabularies) {
      results = JSON.parse(cachedVocabularies);
    } else {
      results = await fetchAndCacheTagsAndVocabulariesFromMySQL(userId);
      await redisService.setVocabulariesToCache(userId, results);
    }

    // * 確保 NO_TAG_NAME 的標籤總是出現在第一個位置
    const noTagIndex = results.findIndex((tag) => tag.name === NO_TAG_NAME);
    if (noTagIndex !== -1) {
      const [noTag] = results.splice(noTagIndex, 1);
      results.unshift(noTag);
    }

    // * 取得使用者單字總量
    let vocabulariesCount = await redisService.getVocabulariesCount(userId);

    if (!vocabulariesCount) {
      vocabulariesCount = await Vocabulary.count({ where: { userId } });
      await redisService.setVocabulariesCount(userId, vocabulariesCount);
    }

    res.status(200).json({
      status: "success",
      userId: userId,
      vocStorage: Number(vocabulariesCount),
      data: results,
    });
  } catch (error) {
    console.error("顯示 Redis 單字資料出現錯誤", error);
    await redisService.pushToErrorQueue({
      action: "getVocabularies",
      userId,
      error: error.message,
    });
    next(error);
  }
}

// * 輔助函數：從 MySQL 獲取並緩存標籤和單字
const fetchAndCacheTagsAndVocabulariesFromMySQL = async (userId) => {
  let results = [];
  try {
    // * 找出該使用者之下，所有沒被歸類標籤的單字 (防護機制)
    const noTagVocabularies = await Vocabulary.findAll({
      where: {
        userId,
        id: {
          [db.Sequelize.Op.notIn]: db.Sequelize.literal(`(
            SELECT DISTINCT vocabularyId
            FROM Vocabulary_Tags AS vt
            JOIN Tags AS t ON vt.tagId = t.id
            WHERE t.userId = ${userId}
          )`),
        },
      },
      attributes: { exclude: ["userId"] },
    });

    // * 無標籤單字，應該要被存到 __NoTag 這個標籤之下 (防護機制)
    if (noTagVocabularies.length > 0) {
      const [tag, created] = await Tag.findOrCreate({
        where: { name: NO_TAG_NAME, userId },
      });
      await Promise.all(
        noTagVocabularies.map(async (vocabulary) => {
          await Vocabulary_Tag.create({
            tagId: tag.id,
            vocabularyId: vocabulary.id,
          });
        })
      );
    }

    // * 找出該使用者之下，所有的標籤，並透過中介表，找到標籤下的單字，作為標籤的屬性
    const tags = await Tag.findAll({
      where: { userId },
      include: [
        {
          model: Vocabulary,
          as: "vocabularies",
          through: { attributes: [] },
          attributes: { exclude: ["userId"] },
        },
      ],
    });

    // * 將找到的標籤放入結果中
    results.push(
      ...tags.map((tag) => ({
        tagId: tag.id,
        name: tag.name.replace(USER_TAG_PREFIX, ""),
        vocabularies: tag.vocabularies.map((vocabulary) => ({
          vocId: vocabulary.id,
          english: vocabulary.english,
          chinese: vocabulary.chinese,
          example: vocabulary.example,
          definition: vocabulary.definition,
          createdAt: vocabulary.createdAt,
          updatedAt: vocabulary.updatedAt,
        })),
      }))
    );
  } catch (mySQLError) {
    console.error("從 MySQL 獲取並緩存標籤和單字出現錯誤：", mySQLError);
    await redisService.pushToErrorQueue({
      action: "fetchAndCacheTagsAndVocabulariesFromMySQL",
      userId,
      error: mySQLError.message,
    });
    throw mySQLError;
  }
  return results;
};

module.exports = getVocabularies;
