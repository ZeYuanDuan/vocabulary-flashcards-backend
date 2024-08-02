const express = require("express");
const router = express.Router();
const { redisClient } = require("../../models/redis");
const db = require("../../models/mysql");
const Vocabulary = db.Vocabulary;

async function getSimpleVocabularies(req, res, next) {
  const userId = req.user.id;
  const start = req.query.start;
  const end = req.query.end;
  try {
    let results = [];
    const vocabulariesKey = `user:${userId}:vocabularies`;
    const vocabularyIds = await redisClient.lRange(vocabulariesKey, start, end);
    if (vocabularyIds.length > 0) {
      results = await Promise.all(
        vocabularyIds.map(async (vocId) => {
          const vocabularyKey = `user:${userId}:vocabularies:${vocId}`;
          const exists = await redisClient.exists(vocabularyKey);
          if (exists) {
            const rawVocabulary = await redisClient.hGetAll(vocabularyKey);
            let vocabulary = {};
            for (const [field, value] of Object.entries(rawVocabulary)) {
              vocabulary[field] = JSON.parse(value);
            }
            return vocabulary;
          } else {
            // 從 MySQL 中獲取單字詳細資料
            const vocabulary = await Vocabulary.findOne({
              where: { id: vocId, userId },
              raw: true,
            });
            if (vocabulary) {
              // 更新 Redis 快取
              for (const [field, value] of Object.entries(vocabulary)) {
                await redisClient.hSet(
                  vocabularyKey,
                  field,
                  JSON.stringify(value)
                );
              }
              // 返回從 MySQL 獲取的單字詳細資料
              return vocabulary;
            } else {
              // 如果 MySQL 中也不存在單字詳細資料，返回 null
              await redisClient.rPush(
                "errorQueue",
                JSON.stringify({
                  action: "fetchAndCacheVocabulariesFromMySQL",
                  userId,
                  error: `找不到 ID 為 ${vocId} 的單字`,
                })
              );
              throw Error(`找不到 ID 為 ${vocId} 的單字`);
            }
          }
        })
      );
      results = results.filter((voc) => voc !== null); // 過濾掉可能的 null 值
    } else {
      // 如果 Redis 中不存在單字 ID 列表，從 MySQL 中獲取並更新 Redis
      results = await fetchAndCacheVocabulariesFromMySQL(userId);
    }

    const userVocStorageKey = `user:${userId}:vocabularies:storage`;
    const userVocStorage = await redisClient.get(userVocStorageKey);

    res.status(200).json({
      status: "success",
      userId: userId,
      vocStorage: parseInt(userVocStorage, 10),
      data: results,
    });
  } catch (error) {
    console.error("從 MySQL 獲取並緩存單字出現錯誤：", error);
    await redisClient.rPush(
      "errorQueue",
      JSON.stringify({
        action: "fetchAndCacheVocabulariesFromMySQL",
        userId,
        error: error.message,
      })
    );
    throw error;
  }
}

// 從 MySQL 找單字並更新 Redis
const fetchAndCacheVocabulariesFromMySQL = async (userId) => {
  try {
    const vocabularies = await Vocabulary.findAll({
      where: { userId },
      attributes: { exclude: ["userId"] },
    });
    const results = vocabularies.map((voc) => voc.dataValues);
    // 更新 Redis
    const vocabulariesKey = `user:${userId}:vocabularies`;
    await Promise.all(
      results.map(async (voc) => {
        const vocabularyKey = `user:${userId}:vocabularies:${voc.id}`;
        for (const [field, value] of Object.entries(voc)) {
          await redisClient.hSet(vocabularyKey, field, JSON.stringify(value));
        }
        await redisClient.rPush(vocabulariesKey, voc.id.toString());
      })
    );
    return results;
  } catch (error) {
    console.error("從 MySQL 獲取並緩存單字出現錯誤：", error);
    await redisClient.rPush(
      "errorQueue",
      JSON.stringify({
        action: "fetchAndCacheVocabulariesFromMySQL",
        userId,
        error: error.message,
      })
    );
    throw error;
  }
};

module.exports = getSimpleVocabularies;
