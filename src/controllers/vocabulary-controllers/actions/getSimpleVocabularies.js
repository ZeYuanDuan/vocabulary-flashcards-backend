const redisService = require("../../../services/vocabulary-services/redisService");
const {
  getSimpleVocabulariesFromMySQL,
  countVocabularies,
} = require("../../../services/vocabulary-services/mysqlService");

async function getSimpleVocabularies(req, res, next) {
  const userId = req.user.id;
  let start = parseInt(req.query.start, 10) || 0;
  let end = parseInt(req.query.end, 10) || -1;

  try {
    const totalRecords = await countVocabularies(userId);

    if (isNaN(start) || start < 0) {
      start = 0;
    }

    if (isNaN(end) || end < 0 || end >= totalRecords) {
      end = totalRecords - 1;
    }

    const limit = end - start + 1;

    let results = [];

    const cachedVocabularies = await redisService.getUserSimpleVocabularies(userId, start, end);

    if (cachedVocabularies) {
      results = JSON.parse(cachedVocabularies);
    } else {
      results = await getSimpleVocabulariesFromMySQL(userId, start, limit);
      await redisService.setSimpleVocabulariesToCache(userId, start, end, results);
    }

    let vocabulariesCount = await redisService.getVocabulariesCount(userId);

    if (!vocabulariesCount) {
      vocabulariesCount = await countVocabularies(userId);
      await redisService.setVocabulariesCount(userId, vocabulariesCount);
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
