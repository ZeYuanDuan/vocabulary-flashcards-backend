const express = require("express");
const vocabularyController = require("../../controllers/vocabulary-controllers/index");

const router = express.Router();

router.get("/", vocabularyController.getVocabularies);
router.get("/simple", vocabularyController.getSimpleVocabularies);

router.post("/", vocabularyController.postVocabularies);
router.patch("/:id", vocabularyController.patchVocabularies);
router.delete("/:id", vocabularyController.deleteVocabularies);

module.exports = router;
