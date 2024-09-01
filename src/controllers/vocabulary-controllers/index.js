getVocabularies = require("./actions/getVocabularies");
getSimpleVocabularies = require("./actions/getSimpleVocabularies");
postVocabularies = require("./actions/postVocabularies");
patchVocabularies = require("./actions/patchVocabularies");
deleteVocabularies = require("./actions/deleteVocabularies");

const vocabularyControllers = {
  getVocabularies,
  postVocabularies,
  patchVocabularies,
  deleteVocabularies,
  getSimpleVocabularies,
};

module.exports = vocabularyControllers;
