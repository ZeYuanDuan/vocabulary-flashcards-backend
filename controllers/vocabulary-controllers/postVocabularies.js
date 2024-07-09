const { where } = require("sequelize");
const db = require("../../models/mysql");
const { redisClient } = require("../../models/redis");
const Vocabulary = db.Vocabulary;

async function postVocabularies(req, res, next) {
  const { english, chinese, definition, example } = req.body;

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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tempKey = `user:${userId}:vocabularies:temp`;

  try {
    // ? 使用 Promise 語法會造成無法執行 Redis 指令，ChatGPt 和 Copilot 也無法理解原因
    const tempField = Object.entries(dataField).map(([field, value]) =>
      redisClient.hSet(tempKey, field, JSON.stringify(value))
    );
    await Promise.all(tempField);

    const userVocStorageKey = `user:${userId}:vocabularies:storage`;
    await redisClient.incr(userVocStorageKey);
    const userVocStorage = await redisClient.get(userVocStorageKey);

    res.status(200).json({
      message: "單字暫存成功",
      vocStorage: userVocStorage,
    });

    setImmediate(async () => {
      try {
        const mysqlField = await Vocabulary.create(dataField);
        const { id } = mysqlField;

        const redisFieldWithId = { id, ...dataField };
        const key = `user:${userId}:vocabularies:${id}`;

        const redisField = Object.entries(redisFieldWithId).map(
          ([field, value]) =>
            redisClient.hSet(key, field, JSON.stringify(value))
        );
        await Promise.all(redisField);

        await redisClient.expire(tempKey, 600);

        const userVocabulariesKey = `user:${userId}:vocabularies`;
        await redisClient.rPush(userVocabulariesKey, id.toString());
      } catch (error) {
        console.error("更新 MySQL 出現錯誤：", error);
        next(error);
      }
    });
  } catch (error) {
    console.error("更新 Redis 出現錯誤：", error);
    next(error);
  }
}

module.exports = postVocabularies;
