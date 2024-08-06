const db = require("../../models/mysql");
const { redisClient } = require("../../models/redis");
const Vocabulary = db.Vocabulary;
const Vocabulary_Tag = db.Vocabulary_Tag;
const Tag = db.Tag;

async function deleteVocabularies(req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const tagIdsResult = await Vocabulary_Tag.findAll({
      where: { vocabularyId: id },
      attributes: ["tagId"],
    });

    const tagIds = tagIdsResult.map((vt) => vt.tagId);

    await Vocabulary.destroy({ where: { id, userId } });

    for (const tagId of tagIds) {
      const remaining = await Vocabulary_Tag.count({ where: { tagId } });
      if (remaining === 0) {
        await Tag.destroy({ where: { id: tagId } });
      }
    }

    const userVocabulariesKey = `user:${userId}:vocabularies`;
    await redisClient.del(userVocabulariesKey);

    // * 單字總量減 1
    const userVocabulariesCountKey = `user:${userId}:vocabularies:count`;
    await redisClient.decr(userVocabulariesCountKey);

    res.status(200).json({
      message: `單字 ID ${id} 刪除成功`,
    });
  } catch (error) {
    console.error("deleteVocabularies 出現錯誤：", error);
    next(error);
  }
}

module.exports = deleteVocabularies;
