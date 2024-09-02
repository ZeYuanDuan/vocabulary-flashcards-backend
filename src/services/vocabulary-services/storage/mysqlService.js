// * MySQL 資料庫邏輯
const db = require("../../../models/mysql");
const Vocabulary = db.Vocabulary;
const Tag = db.Tag;

const {
  USER_TAG_PREFIX,
  NO_TAG_NAME,
  createOrFindTag,
  associateVocabularyWithTag,
} = require("../field/tagService");

const getVocabulariesFromMySQL = async (userId) => {
  let results = [];
  try {
    const noTagVocabularies = await Vocabulary.findAll({
      where: {
        userId,
        id: {
          [db.Sequelize.Op.notIn]: db.Sequelize.literal(`(
            SELECT DISTINCT vocabularyId
            FROM Vocabulary_Tags AS vt
            JOIN Tags AS t ON vt.tagId = t.id
            WHERE t.userId = ${userId}
          )`),
        },
      },
      attributes: { exclude: ["userId"] },
    });

    if (noTagVocabularies.length > 0) {
      const [tag, created] = await createOrFindTag(NO_TAG_NAME, userId);
      await Promise.all(
        noTagVocabularies.map(async (vocabulary) => {
          await associateVocabularyWithTag(vocabulary.id, tag.id);
        })
      );
    }

    const tags = await Tag.findAll({
      where: { userId },
      include: [
        {
          model: Vocabulary,
          as: "vocabularies",
          through: { attributes: [] },
          attributes: { exclude: ["userId"] },
        },
      ],
    });

    results.push(
      ...tags.map((tag) => ({
        tagId: tag.id,
        name: tag.name.replace(USER_TAG_PREFIX, ""),
        vocabularies: tag.vocabularies.map((vocabulary) => ({
          vocId: vocabulary.id,
          english: vocabulary.english,
          chinese: vocabulary.chinese,
          example: vocabulary.example,
          definition: vocabulary.definition,
          createdAt: vocabulary.createdAt,
          updatedAt: vocabulary.updatedAt,
        })),
      }))
    );

    const noTagIndex = results.findIndex((tag) => tag.name === NO_TAG_NAME);
    if (noTagIndex !== -1) {
      const [noTag] = results.splice(noTagIndex, 1);
      results.unshift(noTag);
    }
  } catch (error) {
    throw error;
  }
  return results;
};

const getSimpleVocabulariesFromMySQL = async (userId, start, limit) => {
  return await Vocabulary.findAll({
    where: { userId },
    attributes: { exclude: ["userId"] },
    offset: start,
    limit: limit > 0 ? limit : undefined,
    raw: true,
  });
};

const getVocabularyById = async (vocabularyId, userId) => {
  return await Vocabulary.findOne({
    where: { id: vocabularyId, userId },
  });
};

const createVocabulary = async (data) => {
  return await Vocabulary.create(data);
};

const updateVocabulary = async (data, vocabularyId, userId) => {
  return await Vocabulary.update(data, {
    where: { id: vocabularyId, userId },
  });
};

const deleteVocabulary = async (vocabularyId, userId) => {
  return await Vocabulary.destroy({ where: { id: vocabularyId, userId } });
};

const countVocabularies = async (userId) => {
  return await Vocabulary.count({ where: { userId } });
};

module.exports = {
  getVocabulariesFromMySQL,
  getSimpleVocabulariesFromMySQL,
  getVocabularyById,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  countVocabularies,
};
