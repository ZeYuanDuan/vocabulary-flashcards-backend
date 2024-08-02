const db = require("../../models/mysql");
const { redisClient } = require("../../models/redis");
const Vocabulary = db.Vocabulary;
const Tag = db.Tag;
const Vocabulary_Tag = db.Vocabulary_Tag;

const SYSTEM_TAG_PREFIX = "__";
const USER_TAG_PREFIX = "user_";

async function patchVocabularies(req, res, next) {
  const { id } = req.params;
  const { english, chinese, definition, example, tags } = req.body;

  const updateField = {
    english,
    chinese,
    definition,
    example,
    updatedAt: new Date(),
  };

  const userId = req.user.id;
  const key = `user:${userId}:vocabularies:${id}`;
  const userVocStorageKey = `user:${userId}:vocabularies:storage`;

  try {
    const userVocStorage = await redisClient.get(userVocStorageKey);

    const exists = await redisClient.exists(key);
    if (!exists) {
      await Vocabulary.update(filterUndefined(updateField), {
        where: { id, userId },
      });

      const newField = { id, ...updateField, createdAt: new Date() };
      await updateRedis(key, filterUndefined(newField));
    } else {
      await updateRedis(key, filterUndefined(updateField));

      setImmediate(async () => {
        try {
          await Vocabulary.update(filterUndefined(updateField), {
            where: { id, userId },
          });
        } catch (mySQLError) {
          console.error("更新 MySQL 出現錯誤：", mySQLError);
          await redisClient.rPush(
            "errorQueue",
            JSON.stringify({
              action: "patchVocabularies",
              userId,
              dataField: updateField,
              error: mySQLError.message,
            })
          );
        }
      });
    }

    if (tags) {
      let tagList =
        Array.isArray(tags) && tags.length > 0
          ? tags.map((tag) => USER_TAG_PREFIX + tag)
          : [`${SYSTEM_TAG_PREFIX}NoTag`];

      // 先刪除原本該單字所屬的標籤中的單字 ID
      const oldTags = await Vocabulary_Tag.findAll({
        where: { vocabularyId: id },
      });
      for (const oldTag of oldTags) {
        const oldTagKey = `user:${userId}:tags:${oldTag.tagId}`;
        await redisClient.sRem(oldTagKey, id.toString());

        // 檢查標籤是否還包含其他單字
        const tagCount = await redisClient.sCard(oldTagKey);
        if (tagCount === 0) {
          // 刪除標籤
          const tagDetailsKey = `user:${userId}:tags:${oldTag.tagId}:details`;
          await redisClient.del(oldTagKey);
          await redisClient.del(tagDetailsKey);

          // 從用戶標籤列表中刪除標籤 ID
          const userTagsKey = `user:${userId}:tags`;
          await redisClient.sRem(userTagsKey, oldTag.tagId.toString());

          // 刪除資料庫中的 Tag 和 Vocabulary_Tag 資料
          await Tag.destroy({ where: { id: oldTag.tagId } });
          await Vocabulary_Tag.destroy({ where: { tagId: oldTag.tagId } });
        }
      }

      for (const tagName of tagList) {
        let tag = await Tag.findOne({
          where: { name: tagName, userId: userId },
        });
        if (!tag) {
          tag = await Tag.create({ name: tagName, userId: userId });
        }
        await Vocabulary_Tag.destroy({ where: { vocabularyId: id } });
        await Vocabulary_Tag.create({ tagId: tag.id, vocabularyId: id });

        // 更新 Redis 標籤資料
        const tagKey = `user:${userId}:tags:${tag.id}`;
        const tagDetailsKey = `user:${userId}:tags:${tag.id}:details`;
        await redisClient.hSet(tagDetailsKey, "id", tag.id);
        await redisClient.hSet(tagDetailsKey, "name", tag.name);
        await redisClient.hSet(tagDetailsKey, "userId", tag.userId.toString());
        await redisClient.sAdd(tagKey, id.toString());

        // 將標籤 ID 加入用戶標籤列表
        const userTagsKey = `user:${userId}:tags`;
        await redisClient.sAdd(userTagsKey, tag.id.toString());
      }
    }

    res.status(200).json({
      message: `單字 ID ${id} 更新成功`,
      vocStorage: userVocStorage,
    });
  } catch (error) {
    console.error("更新 Redis 出現錯誤：", error);
    await redisClient.rPush(
      "errorQueue",
      JSON.stringify({
        action: "patchVocabularies",
        userId,
        vocabularyId: id,
        error: error.message,
      })
    );
    next(error);
  }
}

// 輔助函數：更新 Redis
const updateRedis = async (key, updateField) => {
  const redisField = Object.entries(updateField).map(([field, value]) =>
    redisClient.hSet(key, field, JSON.stringify(value))
  );
  await Promise.all(redisField);
};

// 輔助函數：過濾掉 undefined 的欄位
const filterUndefined = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

module.exports = patchVocabularies;
