const formatResponse = (status, userId, vocStorage, data) => {
  return {
    status,
    userId,
    vocStorage: Number(vocStorage),
    data,
  };
};

const formatVocabularyCreatedResponse = (vocabularyId) => {
  return {
    message: "單字儲存成功",
    vocabularyId: vocabularyId,
  };
};

const formatVocabularyUpdatedResponse = (vocabularyId) => {
  return {
    message: `單字 ID ${vocabularyId} 更新成功`,
  };
};

const formatVocabularyDeletedResponse = (vocabularyId) => {
  return {
    message: `單字 ID ${vocabularyId} 刪除成功`,
  };
};

module.exports = {
  formatResponse,
  formatVocabularyCreatedResponse,
  formatVocabularyUpdatedResponse,
  formatVocabularyDeletedResponse,
};
