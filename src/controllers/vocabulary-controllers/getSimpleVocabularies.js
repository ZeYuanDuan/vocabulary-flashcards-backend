const db = require("../../models/mysql");
const { redisClient } = require("../../models/redis");
const Vocabulary = db.Vocabulary;

async function getSimpleVocabularies(req, res, next) {
  const userId = req.user.id;
  let start = parseInt(req.query.start, 10) || 0;
  let end = parseInt(req.query.end, 10) || -1;

  try {
    const totalRecords = await Vocabulary.count({ where: { userId } });

    if (isNaN(start) || start < 0) {
      start = 0;
    }

    if (isNaN(end) || end < 0 || end >= totalRecords) {
      end = totalRecords - 1;
    }

    const limit = end - start + 1;

    let results = [];

    // 檢查 Redis 快取
    const userSimpleVocabulariesKey = `user:${userId}:simpleVocabularies:${start}-${end}`;
    const cachedVocabularies = await redisClient.json.get(
      userSimpleVocabulariesKey
    );

    if (cachedVocabularies) {
      results = JSON.parse(cachedVocabularies);
    } else {
      // 從 MySQL 中獲取單字詳細資料
      results = await Vocabulary.findAll({
        where: { userId },
        attributes: { exclude: ["userId"] },
        offset: start,
        limit: limit > 0 ? limit : undefined,
        raw: true,
      });

      await redisClient.json.set(
        userSimpleVocabulariesKey,
        ".",
        JSON.stringify(results)
      );
      await redisClient.expire(userSimpleVocabulariesKey, 3600);
    }

    // * 取得使用者單字總量
    const userVocabulariesCountKey = `user:${userId}:vocabularies:count`;

    let vocabulariesCount = await redisClient.get(userVocabulariesCountKey);

    if (!vocabulariesCount) {
      vocabulariesCount = await Vocabulary.count({ where: { userId } });
      await redisClient.set(
        userVocabulariesCountKey,
        vocabulariesCount,
        "EX",
        3600
      );
    }

    res.status(200).json({
      status: "success",
      userId: userId,
      vocStorage: Number(vocabulariesCount),
      data: results,
    });
  } catch (error) {
    console.error("從 MySQL 獲取單字出現錯誤：", error);
    next(error);
  }
}

module.exports = getSimpleVocabularies;
