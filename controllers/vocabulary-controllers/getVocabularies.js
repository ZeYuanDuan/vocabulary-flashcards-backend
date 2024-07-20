const db = require("../../models/mysql");
const { redisClient } = require("../../models/redis");
const Vocabulary = db.Vocabulary;
const Tag = db.Tag;
const Vocabulary_Tag = db.Vocabulary_Tag;

const SYSTEM_TAG_PREFIX = "__";
const USER_TAG_PREFIX = "user_";
const NO_TAG_NAME = `${SYSTEM_TAG_PREFIX}NoTag`;

async function getVocabularies(req, res, next) {
  const perfStart = performance.now(); // ! 測試用

  const userId = req.user.id;

  try {
    let results = [];

    // 檢查 Redis 快取
    const cachedTagsKey = `user:${userId}:tags`;
    const cachedTags = await redisClient.sMembers(cachedTagsKey);

    if (cachedTags.length > 0) {
      for (const tagId of cachedTags) {
        const tagDetailsKey = `user:${userId}:tags:${tagId}:details`;
        const tagDetails = await redisClient.hGetAll(tagDetailsKey);
        const vocabularyIdsKey = `user:${userId}:tags:${tagId}`;
        const vocabularyIds = await redisClient.sMembers(vocabularyIdsKey);
        const vocabularies = await Promise.all(
          vocabularyIds.map(async (id) => {
            const vocabularyKey = `user:${userId}:vocabularies:${id}`;
            const exists = await redisClient.exists(vocabularyKey);
            if (exists) {
              return await parseVocabularyFromRedis(vocabularyKey);
            } else {
              return await fetchAndCacheVocabularyFromMySQL(
                id,
                userId,
                vocabularyKey
              );
            }
          })
        );
        results.push({
          tagId: tagDetails.id,
          name: tagDetails.name.replace(USER_TAG_PREFIX, ""),
          vocabularies: vocabularies.map((voc) => ({
            vocId: voc.id,
            english: voc.english,
            chinese: voc.chinese,
            example: voc.example,
            definition: voc.definition,
            createdAt: voc.createdAt,
            updatedAt: voc.updatedAt,
          })),
        });
      }
    } else {
      results = await fetchAndCacheTagsAndVocabulariesFromMySQL(userId);
    }

    const userVocStorageKey = `user:${userId}:vocabularies:storage`;
    const userVocStorage = await redisClient.get(userVocStorageKey);

    res.status(200).json({
      status: "success",
      userId: userId,
      vocStorage: parseInt(userVocStorage, 10),
      data: results,
    });

    const perfEnd = performance.now(); // ! 測試用
    console.log(`Redis 讀取耗時: ${perfEnd - perfStart} ms`); // ! 測試用
  } catch (error) {
    console.error("顯示 Redis 單字資料出現錯誤", error);
    await redisClient.rPush(
      "errorQueue",
      JSON.stringify({
        action: "getVocabularies",
        userId,
        error: error.message,
      })
    );
    next(error);
  }
}

// 輔助函數：解析 Redis 中的單字
const parseVocabularyFromRedis = async (vocabularyKey) => {
  const rawVocabulary = await redisClient.hGetAll(vocabularyKey);
  let vocabulary = {};
  for (const [field, value] of Object.entries(rawVocabulary)) {
    try {
      vocabulary[field] = JSON.parse(value);
    } catch (error) {
      vocabulary[field] = value;
    }
  }
  return vocabulary;
};

// 輔助函數：從 MySQL 獲取並緩存單字
const fetchAndCacheVocabularyFromMySQL = async (id, userId, vocabularyKey) => {
  try {
    const vocabulary = await Vocabulary.findOne({
      where: { id, userId },
      attributes: { exclude: ["userId"] },
      include: [
        {
          model: Tag,
          as: "tags",
          attributes: ["name"],
          through: { attributes: [] },
        },
      ],
    });
    if (!vocabulary) {
      return null;
    }
    const dataValue = vocabulary.dataValues;
    for (const [field, value] of Object.entries(dataValue)) {
      await redisClient.hSet(vocabularyKey, field, JSON.stringify(value));
    }

    const tags = dataValue.tags.map((tag) => tag.name);
    const tagsKey = `user:${userId}:vocabularies:${id}:tags`;
    await redisClient.sAdd(
      tagsKey,
      tags.map((tag) => USER_TAG_PREFIX + tag)
    );

    return dataValue;
  } catch (mySQLError) {
    console.error("更新 MySQL 出現錯誤：", mySQLError);
    await redisClient.rPush(
      "errorQueue",
      JSON.stringify({
        action: "fetchAndCacheVocabularyFromMySQL",
        userId,
        vocabularyId: id,
        error: mySQLError.message,
      })
    );
    throw mySQLError;
  }
};

// 輔助函數：從 MySQL 獲取並緩存標籤和單字
const fetchAndCacheTagsAndVocabulariesFromMySQL = async (userId) => {
  let results = [];
  try {
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

    if (noTagVocabularies.length > 0) {
      results.push({
        tagId: null,
        name: NO_TAG_NAME,
        vocabularies: noTagVocabularies.map((vocabulary) => ({
          vocId: vocabulary.id,
          english: vocabulary.english,
          chinese: vocabulary.chinese,
          example: vocabulary.example,
          definition: vocabulary.definition,
          createdAt: vocabulary.createdAt,
          updatedAt: vocabulary.updatedAt,
        })),
      });
    }

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

    // 更新 Redis 快取
    const cachedTagsKey = `user:${userId}:tags`;
    await redisClient.sAdd(
      cachedTagsKey,
      tags.map((tag) => tag.id.toString())
    );
    for (const tag of tags) {
      const tagDetailsKey = `user:${userId}:tags:${tag.id}:details`;
      await redisClient.hSet(tagDetailsKey, "id", tag.id.toString());
      await redisClient.hSet(tagDetailsKey, "name", tag.name);
      await redisClient.hSet(tagDetailsKey, "userId", tag.userId.toString());
      const vocabularyIdsKey = `user:${userId}:tags:${tag.id}`;
      await redisClient.sAdd(
        vocabularyIdsKey,
        tag.vocabularies.map((voc) => voc.id.toString())
      );
    }
  } catch (mySQLError) {
    console.error("從 MySQL 獲取並緩存標籤和單字出現錯誤：", mySQLError);
    await redisClient.rPush(
      "errorQueue",
      JSON.stringify({
        action: "fetchAndCacheTagsAndVocabulariesFromMySQL",
        userId,
        error: mySQLError.message,
      })
    );
    throw mySQLError;
  }
  return results;
};

module.exports = getVocabularies;
