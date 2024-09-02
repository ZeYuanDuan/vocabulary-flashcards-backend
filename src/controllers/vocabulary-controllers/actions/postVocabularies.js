const redisService = require("../../../services/vocabulary-services/storage/redisService");
const mysqlService = require("../../../services/vocabulary-services/storage/mysqlService");
const {
  createDataField,
} = require("../../../services/vocabulary-services/field/fieldService");
const {
  filterUndefined,
} = require("../../../services/vocabulary-services/utils/filterUndefined");
const {
  validateEnglishField,
} = require("../../../services/vocabulary-services/field/validationService");
const {
  processVocabularyTags,
} = require("../../../services/vocabulary-services/field/tagService");
const {
  formatVocabularyCreatedResponse,
} = require("../../../services/vocabulary-services/responseService");
const {
  handleError,
} = require("../../../services/vocabulary-services/errorService");

// ======================================================

async function postVocabularies(req, res, next) {
  const { english, chinese, definition, example, tags } = req.body;

  if (!validateEnglishField(english, res)) return;

  const userId = req.user.id;
  const dataField = createDataField({
    english,
    chinese,
    definition,
    example,
    userId,
  });

  try {
    const mysqlField = await mysqlService.createVocabulary(
      filterUndefined(dataField)
    );
    const { id: vocabularyId } = mysqlField;

    await processVocabularyTags(tags, userId, vocabularyId);

    await redisService.deleteVocabulariesFromCache(userId);
    await redisService.incrementVocabulariesCount(userId);

    res.status(200).json(formatVocabularyCreatedResponse(vocabularyId));
  } catch (error) {
    await handleError(error, "postVocabularies", userId, next);
  }
}

module.exports = postVocabularies;
