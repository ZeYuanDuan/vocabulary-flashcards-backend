const db = require("../models/mysql");
const { redisClient } = require("../models/redis");
const Vocabulary = db.Vocabulary;

const homeControllers = {
  getHomePage: async (req, res, next) => {
    console.log("反序列化拿到的東西：", req.user); // 測試用
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

  fetchAndStoreVocabularies: async (userId) => {
    try {
      // TODO 這裡的 newContent 應是從外部 API 取得的資料

      const dailyKey = `user:${userId}:vocabularies:daily`;
      for (const vocab of newContent) {
        await redisClient.rPush(dailyKey, JSON.stringify(vocab));
        await redisClient.expire(dailyKey, 86400); // * 24 小時
      }
    } catch (error) {
      console.error("更新 Redis 時出現錯誤：", error);
      await redisClient.rPush(
        "errorQueue",
        JSON.stringify({
          action: "fetchAndStoreVocabularies",
          userId,
          dataField: newContent,
          error: error.message,
        })
      );
    }
  },
};

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

const newContent = [
  { english: "simulation", chinese: "模擬" },
  { english: "chimera", chinese: "嵌合體" },
  { english: "teacup", chinese: "茶杯" },
  { english: "old-time", chinese: "舊時" },
  { english: "indecorous", chinese: "不雅" },
  { english: "pilot", chinese: "飛行員" },
  { english: "sober", chinese: "清醒" },
  { english: "covet", chinese: "覬覦" },
  { english: "trashy", chinese: "垃圾" },
  { english: "temporary", chinese: "臨時" },
  { english: "goldfish", chinese: "金魚" },
  { english: "high-pitched", chinese: "高-傾斜" },
  { english: "exorbitant", chinese: "過高" },
  { english: "chiseled", chinese: "輪廓分明" },
  { english: "topple", chinese: "傾倒" },
  { english: "flung", chinese: "猛擊" },
  { english: "acupuncture", chinese: "針灸" },
  { english: "freeze", chinese: "結凍" },
  { english: "choppy", chinese: "波濤洶湧" },
  { english: "menorah", chinese: "燭台" },
];
