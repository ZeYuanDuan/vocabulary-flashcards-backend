const db = require("../models/mysql");
const Vocabulary = db.Vocabulary;

const vocabularyControllers = {
  getVocabularies: async (req, res, next) => {
    try {
      const userId = req.user.id;

      const vocabularies = await Vocabulary.findAll({
        where: {
          userId,
        },
        attributes: ["id", "english", "chinese", "definition", "example"],
      });
      return res.status(200).json(vocabularies);
    } catch (error) {
      next(error);
    }
  },

  postVocabularies: async (req, res, next) => {
    const { english, chinese, definition, example } = req.body;
    if (!english) {
      return res.status(400).json({ message: "未加入英文單字" });
    }
    try {
      const userId = req.user.id;
      const data = await Vocabulary.create({
        english,
        chinese,
        definition,
        example,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return res.status(201).json({
        message: "單字新增成功",
        vocabularyId: data.id.toString(),
      });
    } catch (error) {
      next(error);
    }
  },

  patchVocabularies: async (req, res, next) => {
    const { id } = req.params;
    const { english, chinese, definition, example } = req.body;
    try {
      const userId = req.user.id;
      const [updateResult] = await Vocabulary.update(
        {
          english,
          chinese,
          definition,
          example,
        },
        {
          where: {
            id,
            userId,
          },
        }
      );

      if (updateResult) {
        return res.status(200).json({
          message: `單字 ID ${id} 更新成功`,
          vocabularyId: updateResult.id,
        });
      } else {
        return res.status(404).json({ message: `找不到單字 ID ${id}` });
      }
    } catch (error) {
      next(error);
    }
  },

  deleteVocabularies: async (req, res, next) => {
    const { id } = req.params;
    try {
      const userId = req.user.id;
      const deleteResult = await Vocabulary.destroy({
        where: {
          id,
          userId,
        },
      });

      if (deleteResult) {
        return res.status(200).json({ message: `單字 ID ${id} 刪除成功` });
      } else {
        return res.status(404).json({ message: `找不到單字 ID ${id}` });
      }
    } catch (error) {
      next(error);
    }
  },
};

module.exports = vocabularyControllers;
