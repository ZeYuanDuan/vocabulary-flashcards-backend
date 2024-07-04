const db = require("../models/mysql");
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
};

module.exports = homeControllers;
