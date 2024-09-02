// * 處理單字標籤標籤
const db = require("../../../models/mysql");
const Tag = db.Tag;
const Vocabulary_Tag = db.Vocabulary_Tag;

const SYSTEM_TAG_PREFIX = "__";
const USER_TAG_PREFIX = "user_";
const NO_TAG_NAME = `${SYSTEM_TAG_PREFIX}NoTag`;

const createOrFindTag = async (tagName, userId) => {
  let tag = await Tag.findOne({
    where: { name: tagName, userId: userId },
  });
  if (!tag) {
    tag = await Tag.create({ name: tagName, userId: userId });
  }
  return tag;
};

const associateVocabularyWithTag = async (vocabularyId, tagId) => {
  await Vocabulary_Tag.create({ tagId: tagId, vocabularyId: vocabularyId });
};

const processVocabularyTags = async (tags, userId, vocabularyId) => {
  const uniqueTags = [...new Set(tags)];
  let tagList =
    Array.isArray(uniqueTags) && uniqueTags.length > 0
      ? uniqueTags.map((tag) => USER_TAG_PREFIX + tag)
      : [NO_TAG_NAME];

  for (const tagName of tagList) {
    const tag = await createOrFindTag(tagName, userId);
    await associateVocabularyWithTag(vocabularyId, tag.id);
  }
};

const removeVocabularyTags = async (vocabularyId) => {
  const oldTags = await Vocabulary_Tag.findAll({
    where: { vocabularyId: vocabularyId },
  });

  if (oldTags.length > 0) {
    const tagIds = oldTags.map((tag) => tag.tagId);
    await Vocabulary_Tag.destroy({
      where: {
        tagId: tagIds,
        vocabularyId: vocabularyId,
      },
    });

    for (const tagId of tagIds) {
      const remaining = await Vocabulary_Tag.count({ where: { tagId } });
      if (remaining === 0) {
        await Tag.destroy({ where: { id: tagId } });
      }
    }
  }
};

module.exports = {
  SYSTEM_TAG_PREFIX,
  USER_TAG_PREFIX,
  NO_TAG_NAME,
  processVocabularyTags,
  removeVocabularyTags,
};
