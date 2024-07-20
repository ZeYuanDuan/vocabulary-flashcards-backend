const db = require("../../models/mysql");
const { redisClient } = require("../../models/redis");
const Vocabulary = db.Vocabulary;
const Vocabulary_Tag = db.Vocabulary_Tag;
const Tag = db.Tag;

async function deleteVocabularies(req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const redisExists = await checkRedisExists(userId, id);

    if (!redisExists) {
      const mysqlDeleteResult = await deleteVocabularyFromMySQL(userId, id);

      if (mysqlDeleteResult) {
        await updateRedisAfterDeletion(userId, id);
        const vocStorage = await getRedisVocabularyStorage(userId);
        return res.status(200).json({
          message: `單字 ID ${id} 刪除成功`,
          vocStorage,
        });
      } else {
        return res.status(404).json({ message: `找不到單字 ID ${id}` });
      }
    }

    await deleteVocabularyFromRedis(userId, id);
    const vocStorage = await getRedisVocabularyStorage(userId);

    res.status(200).json({
      message: `單字 ID ${id} 刪除成功`,
      vocStorage,
    });

    setImmediate(async () => {
      try {
        await deleteVocabularyFromMySQL(userId, id);
        await checkAndDeleteEmptyTags(userId, id);
      } catch (mySQLError) {
        await logErrorToRedis("deleteVocabularies", userId, id, mySQLError);
      }
    });
  } catch (error) {
    await logErrorToRedis("deleteVocabularies", userId, id, error);
    next(error);
  }
}

// 輔助函數：檢查 Redis 中是否存在
const checkRedisExists = async (userId, vocabularyId) => {
  const key = `user:${userId}:vocabularies:${vocabularyId}`;
  return await redisClient.exists(key);
};

// 輔助函數：從 Redis 刪除單字
const deleteVocabularyFromRedis = async (userId, vocabularyId) => {
  const key = `user:${userId}:vocabularies:${vocabularyId}`;
  const userVocabulariesKey = `user:${userId}:vocabularies`;

  await redisClient.del(key);
  await redisClient.lRem(userVocabulariesKey, 0, vocabularyId.toString());
  await updateRedisAfterDeletion(userId, vocabularyId);
};

// 輔助函數：從 MySQL 刪除單字
const deleteVocabularyFromMySQL = async (userId, vocabularyId) => {
  return await Vocabulary.destroy({
    where: { id: vocabularyId, userId },
  });
};

// 輔助函數：更新 Redis 刪除後的相關資料
const updateRedisAfterDeletion = async (userId, vocabularyId) => {
  const userVocStorageKey = `user:${userId}:vocabularies:storage`;

  await redisClient.decr(userVocStorageKey);

  // 刪除和該單字相關的標籤資料
  const vocabularyTags = await Vocabulary_Tag.findAll({
    where: { vocabularyId },
  });

  for (const vt of vocabularyTags) {
    const tagId = vt.tagId;
    const tagKey = `user:${userId}:tags:${tagId}`;
    await redisClient.sRem(tagKey, vocabularyId.toString());
  }
};

// 輔助函數：檢查並刪除沒有單字的標籤
const checkAndDeleteEmptyTags = async (userId, vocabularyId) => {
  const vocabularyTags = await Vocabulary_Tag.findAll({
    where: { vocabularyId },
    attributes: ["tagId"],
  });

  for (const vt of vocabularyTags) {
    const tagId = vt.tagId;
    const vocabularyCount = await Vocabulary_Tag.count({
      where: { tagId },
    });

    if (vocabularyCount === 0) {
      await Tag.destroy({
        where: { id: tagId, userId },
      });

      // 刪除 Redis 中的標籤
      const tagKey = `user:${userId}:tags:${tagId}`;
      const tagDetailsKey = `user:${userId}:tags:${tagId}:details`;
      const vocabularyIdsKey = `user:${userId}:tags:${tagId}`;

      await redisClient.del(tagKey);
      await redisClient.del(tagDetailsKey);
      await redisClient.del(vocabularyIdsKey);

      // 從用戶標籤列表中移除標籤ID
      const userTagsKey = `user:${userId}:tags`;
      await redisClient.sRem(userTagsKey, tagId.toString());
    }
  }
};

// 輔助函數：獲取 Redis 中的單字存儲數量
const getRedisVocabularyStorage = async (userId) => {
  const userVocStorageKey = `user:${userId}:vocabularies:storage`;
  const vocStorage = await redisClient.get(userVocStorageKey);
  return parseInt(vocStorage, 10);
};

// 輔助函數：記錄錯誤到 Redis
const logErrorToRedis = async (action, userId, vocabularyId, error) => {
  console.error(`${action} 出現錯誤：`, error);
  await redisClient.rPush(
    "errorQueue",
    JSON.stringify({
      action,
      userId,
      vocabularyId,
      error: error.message,
    })
  );
};

module.exports = deleteVocabularies;
