const db = require("../models/mysql");
const { redisClient } = require("../models/redis");
const Vocabulary = db.Vocabulary;

const util = require("util"); //! 供測試用
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

  getRecommendedVocabularies: async (req, res, next) => {
    const userId = req.user.id;
    try {
      const dailyVocabularies = await getDailyVocabularies(userId);
      res.json(dailyVocabularies);
    } catch (error) {
      res.status(500).json({ error: "獲取每日內容失敗" });
      next(error);
    }
  },

  // * 請求一串英文單字，組裝中文翻譯，存到 Redis 的 daily key
  fetchAndStoreVocabularies: async (userId) => {
    try {
      const dailyKey = `user:${userId}:vocabularies:daily`;
      const exists = await redisClient.exists(dailyKey);
      if (exists) {
        await redisClient.del(dailyKey);
      }

      const wordnikURL = generateWordnikURL();
      const { data } = await axios.get(wordnikURL);
      const filteredData = data.map(({ id, ...keepAttrs }) => keepAttrs);
      const wordSequence = filteredData.map((obj) => obj.word);

      const { data: translationData } = await axios.get(
        generateTranslateURL(wordSequence)
      );
      for (let n = 0; n < translationData.length; n++) {
        console.log(data.data.translations[n].translatedText);
      }

      const combinedArray = filteredData.map((obj, index) => ({
        english: obj.word,
        chinese: translationData.data.translations[index].translatedText,
      }));

      for (const vocab of combinedArray) {
        await redisClient.rPush(dailyKey, JSON.stringify(vocab));
      }
    } catch (error) {
      console.error("更新 Redis 時出現錯誤：", error);
      await redisClient.rPush(
        "errorQueue",
        JSON.stringify({
          action: "fetchAndStoreVocabularies",
          userId,
          dataField: combinedArray,
          error: error.message,
        })
      );
    }
  },

  // * 將 Daily Key 的單字，加上定義和例句，存到 FullDaily Key
  fetchVocabulariesDetail: async (userId) => {
    try {
      const dailyVocabularies = await getDailyVocabularies(userId);
      for (const vocabulary of dailyVocabularies) {
        const { english, chinese } = vocabulary;
        const { data: defData } = await axios.get(
          generateDefinitionURL(english)
        );
        const rawDefinition = defData.find((def) => def?.text)?.text;
        const definition = rawDefinition.replace(/<[^>]*>/g, "");

        const { data: exampleData } = await axios.get(
          generateExampleURL(english)
        );
        const example = exampleData.text;

        const vocabularyDetail = {
          english: english,
          chinese: chinese,
          definition,
          example,
        };

        const fullDailyKey = `user:${userId}:vocabularies:fullDaily`;
        await redisClient.rPush(fullDailyKey, JSON.stringify(vocabularyDetail));
        await new Promise((resolve) => setTimeout(resolve, 1000)); // * 等一秒鐘
      }
    } catch (error) {
      console.error("獲取單字詳細資訊時出現錯誤：", error);
      await redisClient.rPush(
        "errorQueue",
        JSON.stringify({
          action: "fetchVocabulariesDetail",
          userId,
          error: error.message,
        })
      );
    }
  },

  
  // testAxiosAPI: async () => {
  // },
};

// 輔助函式：從 Redis 取得每日單字
const getDailyVocabularies = async (userId) => {
  try {
    const dailyKey = `user:${userId}:vocabularies:daily`;
    const rawVocab = await redisClient.lRange(dailyKey, 0, -1);
    const vocabularies = rawVocab.map((voc) => JSON.parse(voc));
    return vocabularies;
  } catch (error) {
    console.error(`獲取每日單字時出現錯誤: ${error.message}`);
    throw error;
  }
};

module.exports = homeControllers;
