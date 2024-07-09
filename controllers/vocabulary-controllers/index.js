getVocabularies = require("./getVocabularies");
postVocabularies = require("./postVocabularies");
patchVocabularies = require("./patchVocabularies");
deleteVocabularies = require("./deleteVocabularies");

const vocabularyControllers = {
  getVocabularies,
  postVocabularies,
  patchVocabularies,
  deleteVocabularies,
};

module.exports = vocabularyControllers;
