const { where } = require("sequelize");
const db = require("../../models/mysql");
const { redisClient } = require("../../models/redis");
const Vocabulary = db.Vocabulary;

async function deleteVocabularies(req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;
  const key = `user:${userId}:vocabularies:${id}`;
  const userVocStorageKey = `user:${userId}:vocabularies:storage`;
  const userVocabulariesKey = `user:${userId}:vocabularies`;

  try {
    const exists = await redisClient.exists(key);
    if (!exists) {
      await Vocabulary.destroy(
        { english, chinese, definition, example },
        { where: { id, userId } }
      );

      res
        .status(200)
        .json({ message: `單字 ID ${id} 刪除成功`, vocStorage: vocStorage });
    }

    const deleteResult = await redisClient.del(key);
    if (deleteResult) {
      await redisClient.decr(userVocStorageKey);
      await redisClient.lRem(userVocabulariesKey, 0, id.toString());
      vocStorage = await redisClient.get(userVocStorageKey);

      res
        .status(200)
        .json({ message: `單字 ID ${id} 刪除成功`, vocStorage: vocStorage });
    } else {
      res.status(404).json({ message: `找不到單字 ID ${id}` });
    }

    setImmediate(async () => {
      try {
        const deleteResult = await Vocabulary.destroy({
          where: {
            id,
            userId,
          },
        });
        if (!deleteResult) {
          console.error(`MySQL delete failed for vocabulary ID ${id}`);
        }
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

module.exports = deleteVocabularies;
