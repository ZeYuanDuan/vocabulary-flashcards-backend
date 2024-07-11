const db = require("../../models/mysql");
const { redisClient } = require("../../models/redis");
const Vocabulary = db.Vocabulary;

async function getVocabularies(req, res, next) {
  const perfStart = performance.now(); // ! 測試用

  const userId = req.user.id;
  const vocStorage = await redisClient.get(
    `user:${userId}:vocabularies:storage`
  );
  const start = parseInt(req.query.start, 10);
  const end = parseInt(req.query.end, 10);

  console.log(`單字存量：${vocStorage}，開始值：${start}，結束值：${end}`); // ! 測試用

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

      const exists = await redisClient.exists(vocabularyKey);
      if (exists) {
        return await parseVocabularyFromRedis(vocabularyKey);
      } else {
        return await fetchAndCacheVocabularyFromMySQL(
          id,
          userId,
          vocabularyKey
        );
      }
    });
    const vocabularies = await Promise.all(vocabulariesPromises);

    res.status(200).json(vocabularies.filter((voc) => voc !== null));

    const perfEnd = performance.now(); // ! 測試用
    console.log(`Redis 讀取耗時: ${perfEnd - perfStart} ms`); // ! 測試用
  } catch (error) {
    console.error("顯示 Redis 單字資料出現錯誤", error);
    next(error);
  }
}

// 輔助函數：解析 Redis 中的單字
const parseVocabularyFromRedis = async (vocabularyKey) => {
  const rawVocabulary = await redisClient.hGetAll(vocabularyKey);
  let vocabulary = {};
  for (const [field, value] of Object.entries(rawVocabulary)) {
    try {
      vocabulary[field] = JSON.parse(value);
    } catch (error) {
      vocabulary[field] = value;
    }
  }
  // console.log(vocabulary); // ! 測試用
  return vocabulary;
};

// 輔助函數：從 MySQL 獲取並緩存單字
const fetchAndCacheVocabularyFromMySQL = async (id, userId, vocabularyKey) => {
  const vocabulary = await Vocabulary.findOne({
    where: { id, userId },
    attributes: { exclude: ["userId"] },
  });
  if (!vocabulary) {
    return null;
  }
  const dataValue = vocabulary.dataValues;
  for (const [field, value] of Object.entries(dataValue)) {
    await redisClient.hSet(vocabularyKey, field, JSON.stringify(value));
  }
  return vocabulary;
};

// 輔助函數：統一單字資料類型
// * 目前看來資料類型相符，暫且不需要使用到此函數
// const normalize = (vocabulary) => {
//   return {
//     id: parseInt(vocabulary.id, 10),
//     english: vocabulary.english.toString(),
//     chinese: vocabulary.chinese ? vocabulary.chinese.toString() : null,
//     example: vocabulary.example ? vocabulary.example.toString() : null,
//     definition: vocabulary.definition ? vocabulary.definition.toString() : null,
//     createdAt: new Date(vocabulary.createdAt),
//     updatedAt: new Date(vocabulary.updatedAt),
//   };
// };

module.exports = getVocabularies;
