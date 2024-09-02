const redisService = require("../../../services/vocabulary-services/storage/redisService");
const mysqlService = require("../../../services/vocabulary-services/storage/mysqlService");
const {
  validateVocabularyExistence,
} = require("../../../services/vocabulary-services/field/validationService");
const {
  removeVocabularyTags,
} = require("../../../services/vocabulary-services/field/tagService");
const {
  formatVocabularyDeletedResponse,
} = require("../../../services/vocabulary-services/responseService");
const {
  handleError,
} = require("../../../services/vocabulary-services/errorService");

// ======================================================

async function deleteVocabularies(req, res, next) {
  const { id: vocabularyId } = req.params;
  const userId = req.user.id;

  try {
    const vocabulary = await mysqlService.getVocabularyById(
      vocabularyId,
      userId
    );
    if (!validateVocabularyExistence(vocabulary, vocabularyId, res)) return;

    await removeVocabularyTags(vocabularyId);

    await mysqlService.deleteVocabulary(vocabularyId, userId);

    await redisService.deleteVocabulariesFromCache(userId);
    await redisService.decrementVocabulariesCount(userId);

    res.status(200).json(formatVocabularyDeletedResponse(vocabularyId));
  } catch (error) {
    await handleError(error, "deleteVocabularies", userId, next);
  }
}

module.exports = deleteVocabularies;
