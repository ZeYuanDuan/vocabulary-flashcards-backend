const db = require("../models/mysql");
const { redisClient } = require("../models/redis");
const Vocabulary = db.Vocabulary;

const axios = require("axios");

const VOC_LIMIT = 20;

function generateWordnikURL() {
  const baseUrl = "https://api.wordnik.com/v4/words.json/randomWords";
  const params = new URLSearchParams({
    hasDictionaryDef: true,
    includePartOfSpeech:
      "noun,adjective,verb,adverb,verb-intransitive,verb-transitive,past-participle",
    minCorpusCount: 1000,
    maxCorpusCount: -1,
    minDictionaryCount: 5,
    maxDictionaryCount: -1,
    minLength: 5,
    maxLength: -1,
    api_key: process.env.WORDNIK_KEY,
    limit: VOC_LIMIT,
  });

  return `${baseUrl}?${params.toString()}`;
}

function generateTranslateURL(keywords) {
  const baseUrl = "https://translation.googleapis.com/language/translate/v2";
  const params = new URLSearchParams({
    target: "zh-TW",
    key: process.env.GOOGLE_TRANSLATION_KEY,
  });

  keywords.forEach((keyword) => params.append("q", keyword));

  return `${baseUrl}?${params.toString()}`;
}

function generateDefinitionURL(keyword) {
  const baseUrl = `https://api.wordnik.com/v4/word.json/${keyword}/definitions`;
  const params = new URLSearchParams({
    limit: 3,
    includeRelated: false,
    sourceDictionaries: "all",
    useCanonical: false,
    includeTags: false,
    api_key: process.env.WORDNIK_KEY,
  });
  return `${baseUrl}?${params.toString()}`;
}

function generateExampleURL(keyword) {
  const baseUrl = `https://api.wordnik.com/v4/word.json/${keyword}/topExample`;
  const params = new URLSearchParams({
    useCanonical: false,
    api_key: process.env.WORDNIK_KEY,
  });
  return `${baseUrl}?${params.toString()}`;
}

// =========================

const homeControllers = {
  getHomePage: async (req, res, next) => {
    console.log("反序列化拿到的東西：", req.user); // ! 測試用
    try {
      const { name, id } = req.user;
      const vocStorage = await Vocabulary.count({
        where: { userId: id },
      });
      return res.json({ name, vocStorage });
    } catch (error) {
      next(error);
    }
  },

  getDailyVocabularies: async (req, res, next) => {
    const todayDailyKey = `vocabularies:daily:today`;
    try {
      const todayDailyVocabularies = await redisClient.lRange(
        todayDailyKey,
        0,
        -1
      );
      // 解析每個元素
      const parsedVocabularies = todayDailyVocabularies.map((vocabulary) =>
        JSON.parse(vocabulary)
      );
      res.json(parsedVocabularies);
    } catch (error) {
      res.status(500).json({ error: "獲取每日內容失敗" });
      next(error);
    }
  },

  // * 請求一串英文單字，組裝中文翻譯，存到 raw
  fetchAndStoreVocabularies: async () => {
    try {
      const rawDailyKey = `vocabularies:daily:raw`;
      const exists = await redisClient.exists(rawDailyKey);
      if (exists) {
        await redisClient.del(rawDailyKey);
      }

      const wordnikURL = generateWordnikURL();
      const { data } = await axios.get(wordnikURL);
      const filteredData = data.map(({ id, ...keepAttrs }) => keepAttrs);
      const wordSequence = filteredData.map((obj) => obj.word);

      const { data: translationData } = await fetchWithRetry(
        generateTranslateURL(wordSequence)
      );

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const formattedDate = tomorrow.toISOString().split("T")[0];

      const combinedArray = filteredData.map((obj, index) => ({
        date: formattedDate,
        data: {
          english: obj.word,
          chinese: translationData.data.translations[index].translatedText,
        },
      }));

      for (const vocab of combinedArray) {
        await redisClient.rPush(rawDailyKey, JSON.stringify(vocab));
      }
    } catch (error) {
      console.error("更新 Redis 時出現錯誤：", error);
      await redisClient.rPush(
        "errorQueue",
        JSON.stringify({
          action: "fetchAndStoreVocabularies",
          key: `vocabularies:daily:EngChi`,
          dataField: combinedArray,
          date: formattedDate,
          error: error.message,
        })
      );
    }
  },

  // * 將 Daily Key 的單字，加上定義和例句，存到 details
  fetchVocabulariesDetail: async () => {
    try {
      const detailDailyKey = `vocabularies:daily:details`;
      const exists = await redisClient.exists(detailDailyKey);
      if (exists) {
        await redisClient.del(detailDailyKey);
      }

      const rawDailyKey = `vocabularies:daily:raw`;
      const rawDailyVocab = await redisClient.lRange(rawDailyKey, 0, -1);
      const DailyVocab = rawDailyVocab.map((voc) => JSON.parse(voc));

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

        const vocabularyDetail = {
          date: date,
          data: { english, chinese, definition, example },
        };

        await redisClient.rPush(
          detailDailyKey,
          JSON.stringify(vocabularyDetail)
        );
        await new Promise((resolve) => setTimeout(resolve, 20000)); // * 等 20 秒
      }
    } catch (error) {
      console.error("獲取單字詳細資訊時出現錯誤：", error);
      await redisClient.rPush(
        "errorQueue",
        JSON.stringify({
          action: "fetchVocabulariesDetail",
          key: `vocabularies:daily:details`,
          dataField: vocabularyDetail,
          date: date,
          error: error.message,
        })
      );
    }
  },

  updateDailyVocabularies: async () => {
    const detailDailyKey = `vocabularies:daily:details`;
    const todayDailyKey = `vocabularies:daily:today`;
    const tempKey = `vocabularies:daily:temp:${Date.now()}`;

    try {
      await redisClient.rename(todayDailyKey, tempKey);
      await redisClient.rename(detailDailyKey, todayDailyKey);
      await redisClient.expire(tempKey, 86400);
    } catch (error) {
      console.error("Failed to update daily vocabularies:", error);
      const currentDate = new Date().toISOString();
      await redisClient.rPush(
        "errorQueue",
        JSON.stringify({
          action: "updateDailyVocabularies",
          key: todayDailyKey,
          date: currentDate,
          error: error.message,
        })
      );
    }
  },
};

// * 輔助函式：請求失敗後重試
const fetchWithRetry = async (url, retries = 10) => {
  let attempts = 0;
  while (attempts < retries) {
    try {
      const response = await axios.get(url);
      return response;
    } catch (error) {
      if (
        error.response &&
        error.response.status === 429 &&
        attempts < retries - 1
      ) {
        const retryAfter = error.response.headers["retry-after"];
        const waitTime = (retryAfter ? parseInt(retryAfter) : 60) * 1000;
        console.log(
          `Rate limit exceeded. Retrying after ${waitTime / 1000} seconds.`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        attempts++;
      } else {
        throw error;
      }
    }
  }
};

module.exports = homeControllers;
