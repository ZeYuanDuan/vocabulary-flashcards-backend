const { where } = require("sequelize");
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
  const key = `user:${userId}:vocabularies:${id}`;

  try {
    const exists = await redisClient.exists(key);
    if (!exists) {
      await Vocabulary.update(
        { english, chinese, definition, example },
        { where: { id, userId } }
      );

      const redisField = Object.entries(updateField).map(([field, value]) =>
        redisClient.hSet(key, field, JSON.stringify(value))
      );
      await Promise.all(redisField);

      res.status(200).json({
        message: `單字 ID ${id} 更新成功`,
      });
    }

    const redisField = Object.entries(updateField).map(([field, value]) =>
      redisClient.hSet(key, field, JSON.stringify(value))
    );
    await Promise.all(redisField);

    res.status(200).json({
      message: `單字 ID ${id} 更新成功`,
    });

    setImmediate(async () => {
      try {
        await Vocabulary.update(updateField, {
          where: {
            id,
            userId,
          },
        });
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

module.exports = patchVocabularies;
