const db = require("../models/mysql");
const { redisClient } = require("../models/redis");
const Vocabulary = db.Vocabulary;

const vocabularyControllers = {
  getVocabularies: async (req, res, next) => {
    const perfStart = performance.now(); // ! 測試用
    const userId = req.user.id;
    const vocStorage = await redisClient.get(
      `user:${userId}:vocabularies:storage`
    );
    const start = parseInt(req.query.start, 10);
    const end = parseInt(req.query.end, 10);

    console.log(`單字存量：${vocStorage}，開始值：${start}，結束值：${end}`);

    try {
      if (
        isNaN(start) ||
        isNaN(end) ||
        start < 0 ||
        end < -1 ||
        start > vocStorage - 1 ||
        (start > end && end !== -1)
      ) {
        return res.status(400).json({ message: "無效的開始值或結束值" });
      }

      const userVocabulariesKey = `user:${userId}:vocabularies`;
      const vocabularyIds = await redisClient.lRange(
        userVocabulariesKey,
        start,
        end
      );

      const vocabulariesPromises = vocabularyIds.map(async (id) => {
        const vocabularyKey = `user:${userId}:vocabularies:${id}`;
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
      });
      const vocabularies = await Promise.all(vocabulariesPromises);

      res.status(200).json(vocabularies);
      const perfEnd = performance.now(); // ! 測試用
      console.log(`Redis 讀取耗時: ${perfEnd - perfStart} ms`);
    } catch (error) {
      console.error("顯示 Redis 單字資料出現錯誤：", error);
      next(error);
    }
  },

  postVocabularies: async (req, res, next) => {
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
  },

  patchVocabularies: async (req, res, next) => {
    const { id } = req.params;
    const { english, chinese, definition, example } = req.body;

    const userId = req.user.id;
    const key = `user:${userId}:vocabularies:${id}`;

    try {
      const exists = await redisClient.exists(key);
      if (!exists) {
        return res.status(404).json({ message: `找不到單字 ID ${id}` });
      }

      const updateField = {
        english,
        chinese,
        definition,
        example,
        updatedAt: new Date(),
      };
      const redisField = Object.entries(updateField).map(([field, value]) =>
        redisClient.hSet(key, field, JSON.stringify(value))
      );
      await Promise.all(redisField);

      res.status(200).json({
        message: `單字 ID ${id} 更新成功`,
        vocabularyId: id,
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
  },

  deleteVocabularies: async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;
    const key = `user:${userId}:vocabularies:${id}`;
    const userVocStorageKey = `user:${userId}:vocabularies:storage`;
    const userVocabulariesKey = `user:${userId}:vocabularies`;

    try {
      const exists = await redisClient.exists(key);
      if (!exists) {
        res.status(404).json({ message: `找不到單字 ID ${id}` });
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
  },
};

module.exports = vocabularyControllers;
