const express = require("express");
const router = express.Router();

const vocabularyController = require("../controllers/vocabulary-controller");

router.get("/", vocabularyController.getVocabularies);
router.post("/", vocabularyController.postVocabularies);
router.patch("/:id", vocabularyController.patchVocabularies);
router.delete("/:id", vocabularyController.deleteVocabularies);

module.exports = router;
