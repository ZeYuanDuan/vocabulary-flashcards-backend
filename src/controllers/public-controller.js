const redisService = require("../services/public-services/storage/redisService");
const {
  processWordnikData,
  processVocabularyDetails,
} = require("../services/public-services/apiDataProcessor");
const { handleError } = require("../services/public-services/errorService");
const errorService = require("../services/public-services/errorService");

const publicControllers = {
  // * 取得今日單字 (路由相關)
  getDailyVocabularies: async (req, res, next) => {
    try {
      const parsedVocabularies = await redisService.getTodayDailyVocabularies();
      res.json(parsedVocabularies);
    } catch (error) {
      await errorService.handleError(
        error,
        "getDailyVocabularies",
        "daily:today",
        null,
        next
      );
    }
  },

  // * 請求一組英文單字，加上中文翻譯，存到 raw (cronJob 相關)
  fetchAndStoreRawVocabularies: async () => {
    try {
      const combinedArray = await processWordnikData();
      await redisService.clearAndStoreRawVocabularies(combinedArray);
    } catch (error) {
      await handleError(
        error,
        "fetchAndStoreRawVocabularies",
        `daily:EngChi`,
        combinedArray,
        next
      );
    }
  },

  // * 將 raw 的單字，加上定義和例句，存到 details (cronJob 相關)
  fetchAndStoreVocabularyDetails: async () => {
    try {
      const DailyVocab = await redisService.getRawDailyVocabularies();
      const vocabularyDetails = await processVocabularyDetails(DailyVocab);
      await redisService.clearAndStoreVocabularyDetails(vocabularyDetails);
    } catch (error) {
      await handleError(
        error,
        "fetchAndStoreVocabularyDetails",
        `daily:details`,
        vocabularyDetails,
        next
      );
    }
  },

  // * 將 details 的單字，更新為每日單字 (cronJob 相關)
  updateDailyVocabularies: async () => {
    try {
      await redisService.updateDailyVocabularies();
    } catch (error) {
      await handleError(
        error,
        "updateDailyVocabularies",
        "daily:today",
        null,
        next
      );
    }
  },
};

module.exports = publicControllers;
