const redisService = require("../../../services/vocabulary-services/redisService");
const mysqlService = require("../../../services/vocabulary-services/mysqlService");
const { formatResponse } = require("../../../services/vocabulary-services/responseService");
const { handleError } = require("../../../services/vocabulary-services/errorService");

// ======================================================

async function getVocabularies(req, res, next) {
  const userId = req.user.id;

  try {
    let results = [];

    const cachedVocabularies = await redisService.getVocabulariesFromCache(
      userId
    );

    if (cachedVocabularies) {
      results = JSON.parse(cachedVocabularies);
    } else {
      results = await mysqlService.getVocabulariesFromMySQL(userId);
      await redisService.setVocabulariesToCache(userId, results);
    }

    let vocabulariesCount = await redisService.getVocabulariesCount(userId);

    if (!vocabulariesCount) {
      vocabulariesCount = await mysqlService.countVocabularies(userId);
      await redisService.setVocabulariesCount(userId, vocabulariesCount);
    }

    res.status(200).json(formatResponse("success", userId, vocabulariesCount, results));
  } catch (error) {
    await handleError(error, "getVocabularies", userId, next);
  }
}

module.exports = getVocabularies;
