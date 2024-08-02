const db = require("../../models/mysql");
const { redisClient } = require("../../models/redis");
const Vocabulary = db.Vocabulary;
const Vocabulary_Tag = db.Vocabulary_Tag;
const Tag = db.Tag;

async function deleteVocabularies(req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 1. 在 MySQL 的 Tag 資料表中，找到該單字所屬的所有標籤 id (TagIds)
    const tagIdsResult = await Vocabulary_Tag.findAll({
      where: { vocabularyId: id },
      attributes: ["tagId"],
    });

    const tagIds = tagIdsResult.map((vt) => vt.tagId);

    // 2. (背景執行) 在 MySQL 的 Vocabulary 資料表中，刪除該單字
    // 3. (背景執行) 在 MySQL 的 Vocabulary_Tags 資料表中，找到所有 VocabularyId 和 單字 id 相符的欄位，將其全部刪除。
    // 4. (背景執行) 在 MySQL 檢查在 Vocabulary_Tags 資料表中，TagIds 中的 TagId 是否還有對應欄位，如果沒有，回到 Tags 將該 TagId 對應的欄位刪除，並且到 `user:${userId}:tags` 當中將該 TagId 刪除。
    setImmediate(async () => {
      try {
        await Vocabulary.destroy({ where: { id, userId } });
        await Vocabulary_Tag.destroy({ where: { vocabularyId: id } });

        for (const tagId of tagIds) {
          const remaining = await Vocabulary_Tag.count({ where: { tagId } });
          if (remaining === 0) {
            await Tag.destroy({ where: { id: tagId } });
            const userTagsKey = `user:${userId}:tags`;
            await redisClient.sRem(userTagsKey, tagId.toString());
          }
        }
      } catch (error) {
        await logErrorToRedis("deleteVocabularies", userId, id, error);
      }
    });

    // 5. 在 Redis 當中，刪除 `user:${userId}:vocabularies:${vocabularyId}` (如果有)
    const key = `user:${userId}:vocabularies:${id}`;
    await redisClient.del(key);

    // 6. 從 `user:${userId}:vocabularies` 當中刪除該單字的 id
    const userVocabulariesKey = `user:${userId}:vocabularies`;
    await redisClient.lRem(userVocabulariesKey, 0, id.toString());

    // 7. 將 `user:${userId}:vocabularies:storage` 的數量減一
    const userVocStorageKey = `user:${userId}:vocabularies:storage`;
    await redisClient.decr(userVocStorageKey);

    // 8. 對所有 tagIds 中的 tagId，在 `user:${userId}:tags:${tagId}` 將該單字 Id 刪除。如果此時這個 key 已經沒有任何成員，將該 key 已經所有子鍵全數刪除
    for (const tagId of tagIds) {
      const tagKey = `user:${userId}:tags:${tagId}`;
      await redisClient.sRem(tagKey, id.toString());
      const membersCount = await redisClient.sCard(tagKey);
      if (membersCount === 0) {
        await redisClient.del(tagKey);
        const tagDetailsKey = `user:${userId}:tags:${tagId}:details`;
        const vocabularyIdsKey = `user:${userId}:tags:${tagId}`;
        const userTagsKey = `user:${userId}:tags`;
        await redisClient.del(tagDetailsKey);
        await redisClient.del(vocabularyIdsKey);
        await redisClient.sRem(userTagsKey, tagId.toString());
      }
    }

    res.status(200).json({
      message: `單字 ID ${id} 刪除成功`,
    });
  } catch (error) {
    await logErrorToRedis("deleteVocabularies", userId, id, error);
    next(error);
  }
}

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
