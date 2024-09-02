const redisService = require("../../../services/vocabulary-services/storage/redisService");
const mysqlService = require("../../../services/vocabulary-services/storage/mysqlService");
const {
  createUpdateField,
} = require("../../../services/vocabulary-services/field/fieldService");
const {
  filterUndefined,
} = require("../../../services/vocabulary-services/utils/filterUndefined");
const {
  validateVocabularyExistence,
} = require("../../../services/vocabulary-services/field/validationService");
const {
  processVocabularyTags,
  removeVocabularyTags,
} = require("../../../services/vocabulary-services/field/tagService");
const {
  formatVocabularyUpdatedResponse,
} = require("../../../services/vocabulary-services/responseService");
const {
  handleError,
} = require("../../../services/vocabulary-services/errorService");

// ======================================================

async function patchVocabularies(req, res, next) {
  const { id: vocabularyId } = req.params;
  const userId = req.user.id;

  const { english, chinese, definition, example, tags } = req.body;

  const updateField = createUpdateField({
    english,
    chinese,
    definition,
    example,
  });

  try {
    const vocabulary = await mysqlService.getVocabularyById(
      vocabularyId,
      userId
    );
    if (!validateVocabularyExistence(vocabulary, vocabularyId, res)) return;

    await mysqlService.updateVocabulary(
      filterUndefined(updateField),
      vocabularyId,
      userId
    );

    await removeVocabularyTags(vocabularyId);
    await processVocabularyTags(tags, userId, vocabularyId);

    await redisService.deleteVocabulariesFromCache(userId);

    res.status(200).json(formatVocabularyUpdatedResponse(vocabularyId));
  } catch (error) {
    await handleError(error, "patchVocabularies", userId, next);
  }
}

module.exports = patchVocabularies;
