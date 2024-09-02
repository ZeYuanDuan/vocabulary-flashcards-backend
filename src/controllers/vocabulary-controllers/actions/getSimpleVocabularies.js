const redisService = require("../../../services/vocabulary-services/redisService");
const mysqlService = require("../../../services/vocabulary-services/mysqlService");
const { calculatePagination } = require("../../../services/vocabulary-services/paginationService");
const { formatResponse } = require("../../../services/vocabulary-services/responseService");
const { handleError } = require("../../../services/vocabulary-services/errorService");

// ======================================================

async function getSimpleVocabularies(req, res, next) {
  const userId = req.user.id;

  try {
    const totalRecords = await mysqlService.countVocabularies(userId);
    const { start, end, limit } = calculatePagination(req.query, totalRecords);

    let results = [];

    const cachedVocabularies = await redisService.getUserSimpleVocabularies(
      userId,
      start,
      end
    );

    if (cachedVocabularies) {
      results = JSON.parse(cachedVocabularies);
    } else {
      results = await mysqlService.getSimpleVocabulariesFromMySQL(userId, start, limit);
      await redisService.setSimpleVocabulariesToCache(
        userId,
        start,
        end,
        results
      );
    }

    let vocabulariesCount = await redisService.getVocabulariesCount(userId);

    if (!vocabulariesCount) {
      vocabulariesCount = await mysqlService.countVocabularies(userId);
      await redisService.setVocabulariesCount(userId, vocabulariesCount);
    }

    res.status(200).json(formatResponse("success", userId, vocabulariesCount, results));
  } catch (error) {
    await handleError(error, "getSimpleVocabularies", userId, next);
  }
}

module.exports = getSimpleVocabularies;
