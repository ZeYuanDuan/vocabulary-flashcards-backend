const db = require("../models");
const Vocabulary = db.Vocabulary;

const homeControllers = {
  getHomePage: async (req, res, next) => {
    try {
      const { name, id } = req.user;
      const vocStorage = await Vocabulary.count({
        where: { UserId: id },
      });
      return res.json({ name, vocStorage });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = homeControllers;
