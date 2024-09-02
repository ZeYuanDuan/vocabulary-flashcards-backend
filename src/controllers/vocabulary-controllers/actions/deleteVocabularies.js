const redisService = require("../../../services/vocabulary-services/redisService");
const {
  removeVocabularyTags,
} = require("../../../services/vocabulary-services/tagService");
const mysqlService = require("../../../services/vocabulary-services/mysqlService");
const { formatResponse } = require("../../../services/vocabulary-services/responseService");
const { handleError } = require("../../../services/vocabulary-services/errorService");

async function deleteVocabularies(req, res, next) {
  const { id: vocabularyId } = req.params;
  const userId = req.user.id;

  try {
    const vocabulary = await mysqlService.getVocabularyById(vocabularyId, userId);
    if (!vocabulary) {
      return res.status(404).json({ message: `找不到單字 ID ${vocabularyId}` });
    }

    await removeVocabularyTags(vocabularyId);

    await mysqlService.deleteVocabulary(vocabularyId, userId);

    await redisService.deleteVocabulariesFromCache(userId);
    await redisService.decrementVocabulariesCount(userId);

    res.status(200).json(formatResponse("success", userId, null, { message: `單字 ID ${vocabularyId} 刪除成功` }));
  } catch (error) {
    await handleError(error, "deleteVocabularies", userId, next);
  }
}

module.exports = deleteVocabularies;
