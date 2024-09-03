const redisService = require("../services/public-services/storage/redisService");
const {
  processWordnikData,
  processVocabularyDetails,
} = require("../services/public-services/apiDataProcessor");

const publicControllers = {
  // * 取得今日單字 (路由相關)
  getDailyVocabularies: async (req, res, next) => {
    try {
      const parsedVocabularies = await redisService.getTodayDailyVocabularies();
      res.json(parsedVocabularies);
    } catch (error) {
      res.status(500).json({ error: "獲取每日內容失敗" });
      next(error);
    }
  },

  // * 請求一組英文單字，加上中文翻譯，存到 raw (cronJob 相關)
  fetchAndStoreRawVocabularies: async () => {
    try {
      const combinedArray = await processWordnikData();
      await redisService.clearAndStoreRawVocabularies(combinedArray);
    } catch (error) {
      console.error("更新 Redis 時出現錯誤：", error);
      await redisService.pushToErrorQueue({
        action: "fetchAndStoreRawVocabularies",
        key: `daily:EngChi`,
        dataField: combinedArray,
        date: formattedDate,
        error: error.message,
      });
    }
  },

  // * 將 raw 的單字，加上定義和例句，存到 details (cronJob 相關)
  fetchAndStoreVocabularyDetails: async () => {
    try {
      const DailyVocab = await redisService.getRawDailyVocabularies();
      const vocabularyDetails = await processVocabularyDetails(DailyVocab);
      await redisService.clearAndStoreVocabularyDetails(vocabularyDetails);
    } catch (error) {
      console.error("獲取單字詳細資訊時出現錯誤：", error);
      await redisService.pushToErrorQueue({
        action: "fetchAndStoreVocabularyDetails",
        key: `daily:details`,
        dataField: vocabularyDetails,
        date: date,
        error: error.message,
      });
    }
  },

  // * 更新每日單字 (cronJob 相關)
  updateDailyVocabularies: async () => {
    try {
      await redisService.updateDailyVocabularies();
    } catch (error) {
      console.error("Failed to update daily vocabularies:", error);
      const currentDate = moment().tz("Asia/Taipei").toISOString();
      await redisService.pushToErrorQueue({
        action: "updateDailyVocabularies",
        key: "daily:today",
        date: currentDate,
        error: error.message,
      });
    }
  },
};

module.exports = publicControllers;
