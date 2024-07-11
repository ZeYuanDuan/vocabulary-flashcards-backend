const db = require("../../models/mysql");
const { redisClient } = require("../../models/redis");
const Vocabulary = db.Vocabulary;

async function patchVocabularies(req, res, next) {
  const { id } = req.params;
  const { english, chinese, definition, example } = req.body;

  const updateField = {
    english,
    chinese,
    definition,
    example,
    updatedAt: new Date(),
  };

  const userId = req.user.id;

  const newField = { id, ...updateField, createdAt: new Date() };

  const key = `user:${userId}:vocabularies:${id}`;
  const userVocStorageKey = `user:${userId}:vocabularies:storage`;

  try {
    const userVocStorage = await redisClient.get(userVocStorageKey);

    const exists = await redisClient.exists(key);
    if (!exists) {
      await Vocabulary.update(filterUndefined(updateField), {
        where: { id, userId },
      });

      await updateRedis(key, filterUndefined(newField));
    } else {
      await updateRedis(key, filterUndefined(updateField));

      setImmediate(async () => {
        try {
          await Vocabulary.update(filterUndefined(updateField), {
            where: {
              id,
              userId,
            },
          });
        } catch (mySQLError) {
          console.error("更新 MySQL 出現錯誤：", error);
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

    res.status(200).json({
      message: `單字 ID ${id} 更新成功`,
      vocStorage: userVocStorage,
    });
  } catch (error) {
    console.error("更新 Redis 出現錯誤：", error);
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
