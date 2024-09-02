const redisService = require("../../../services/vocabulary-services/redisService");
const {
  removeVocabularyTags,
} = require("../../../services/vocabulary-services/tagService");
const mysqlService = require("../../../services/vocabulary-services/mysqlService");
const { formatResponse } = require("../../../services/vocabulary-services/responseService");

async function deleteVocabularies(req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const vocabulary = await mysqlService.getVocabularyById(id, userId);
    if (!vocabulary) {
      return res.status(404).json({ message: `找不到單字 ID ${id}` });
    }

    await removeVocabularyTags(id);

    await mysqlService.deleteVocabulary(id, userId);

    await redisService.deleteVocabulariesFromCache(userId);
    await redisService.decrementVocabulariesCount(userId);

    res.status(200).json(formatResponse("success", userId, null, { message: `單字 ID ${id} 刪除成功` }));
  } catch (error) {
    console.error("deleteVocabularies 出現錯誤：", error);
    next(error);
  }
}

module.exports = deleteVocabularies;
