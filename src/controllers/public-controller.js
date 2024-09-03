const redisService = require("../services/public-services/storage/redisService");
const axios = require("axios");
const moment = require("moment-timezone");
const fetchWithRetry = require("../services/public-services/utils/fetchWithRetry");
const {
  generateWordnikURL,
  generateTranslateURL,
  generateDefinitionURL,
  generateExampleURL,
} = require("../apiHelpers/wordnik");

const publicControllers = {
  // * 取得今日單字
  getDailyVocabularies: async (req, res, next) => {
    try {
      const parsedVocabularies = await redisService.getTodayDailyVocabularies();
      res.json(parsedVocabularies);
    } catch (error) {
      res.status(500).json({ error: "獲取每日內容失敗" });
      next(error);
    }
  },

  // * 請求一組英文單字，加上中文翻譯，存到 raw
  fetchAndStoreRawVocabularies: async () => {
    try {
      const wordnikURL = generateWordnikURL();
      const { data } = await axios.get(wordnikURL);
      const filteredData = data.map(({ id, ...keepAttrs }) => keepAttrs);
      const wordSequence = filteredData.map((obj) => obj.word);

      const { data: translationData } = await fetchWithRetry(
        generateTranslateURL(wordSequence)
      );

      const today = moment().tz("Asia/Taipei");
      const tomorrow = moment(today).add(1, "day");
      const formattedDate = tomorrow.format("YYYY-MM-DD");

      const combinedArray = filteredData.map((obj, index) => ({
        date: formattedDate,
        data: {
          english: obj.word,
          chinese: translationData.data.translations[index].translatedText,
        },
      }));

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

  // * 將 raw 的單字，加上定義和例句，存到 details
  fetchAndStoreVocabularyDetails: async () => {
    try {
      const DailyVocab = await redisService.getRawDailyVocabularies();
      const vocabularyDetails = [];

      for (const { date, data } of DailyVocab) {
        const { english, chinese } = data;
        const { data: defData } = await fetchWithRetry(
          generateDefinitionURL(english)
        );
        const rawDefinition = defData.find((def) => def?.text)?.text;
        const definition = rawDefinition
          ? Array.isArray(rawDefinition)
            ? rawDefinition.join(", ").replace(/<[^>]*>/g, "")
            : rawDefinition.replace(/<[^>]*>/g, "")
          : "No definition available";

        console.log("定義：", definition); // ! 測試用

        const { data: exampleData } = await fetchWithRetry(
          generateExampleURL(english)
        );
        const example = exampleData.text
          ? Array.isArray(exampleData.text)
            ? exampleData.text.join(", ")
            : exampleData.text
          : "No example available";

        console.log("例句：", example); // ! 測試用

        vocabularyDetails.push({
          date: date,
          data: { english, chinese, definition, example },
        });

        await new Promise((resolve) => setTimeout(resolve, 20000)); // * 等 20 秒
      }

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

  // * 更新每日單字
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
