const redisService = require("../../../services/vocabulary-services/redisService");
const {
  removeVocabularyTags,
} = require("../../../services/vocabulary-services/tagService");
const {
  getVocabularyById,
  deleteVocabulary,
} = require("../../../services/vocabulary-services/mysqlService");

async function deleteVocabularies(req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const vocabulary = await getVocabularyById(id, userId);
    if (!vocabulary) {
      return res.status(404).json({ message: `找不到單字 ID ${id}` });
    }

    await removeVocabularyTags(id);

    await deleteVocabulary(id, userId);

    await redisService.deleteVocabulariesFromCache(userId);
    await redisService.decrementVocabulariesCount(userId);

    res.status(200).json({
      message: `單字 ID ${id} 刪除成功`,
    });
  } catch (error) {
    console.error("deleteVocabularies 出現錯誤：", error);
    next(error);
  }
}

module.exports = deleteVocabularies;
