const { redisClient } = require("../../../models/redis");

const KEYS = {
  DAILY_TODAY: "daily:today",
  DAILY_RAW: "daily:raw",
  DAILY_DETAILS: "daily:details",
  ERROR_QUEUE: "errorQueue",
  TEMP: () => `daily:temp:${Date.now()}`,
};

const redisService = {
  getTodayDailyVocabularies: async () => {
    const todayDailyVocabularies = await redisClient.lRange(
      KEYS.DAILY_TODAY,
      0,
      -1
    );
    return todayDailyVocabularies.map((vocabulary) => JSON.parse(vocabulary));
  },

  clearAndStoreRawVocabularies: async (combinedArray) => {
    await redisClient.del(KEYS.DAILY_RAW);
    for (const vocab of combinedArray) {
      await redisClient.rPush(KEYS.DAILY_RAW, JSON.stringify(vocab));
    }
  },

  getRawDailyVocabularies: async () => {
    const rawDailyVocab = await redisClient.lRange(KEYS.DAILY_RAW, 0, -1);
    return rawDailyVocab.map((voc) => JSON.parse(voc));
  },

  clearAndStoreVocabularyDetails: async (vocabularyDetails) => {
    await redisClient.del(KEYS.DAILY_DETAILS);
    for (const detail of vocabularyDetails) {
      await redisClient.rPush(KEYS.DAILY_DETAILS, JSON.stringify(detail));
    }
  },

  updateDailyVocabularies: async () => {
    const tempKey = KEYS.TEMP();
    if (!(await redisClient.exists(KEYS.DAILY_TODAY))) {
      await redisClient.lPush(KEYS.DAILY_TODAY, '["No data available"]');
    } else if (!(await redisClient.exists(KEYS.DAILY_DETAILS))) {
      await redisClient.lPush(KEYS.DAILY_DETAILS, '["No data available"]');
    }

    await redisClient.rename(KEYS.DAILY_TODAY, tempKey);
    await redisClient.rename(KEYS.DAILY_DETAILS, KEYS.DAILY_TODAY);
    await redisClient.expire(tempKey, 86400);
  },

  pushToErrorQueue: async (error) => {
    await redisClient.rPush(KEYS.ERROR_QUEUE, JSON.stringify(error));
  },
};

module.exports = redisService;
