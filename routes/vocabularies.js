const express = require("express");
const router = express.Router();

const vocabularyController = require("../controllers/vocabulary-controller");

router.get("/", vocabularyController.getVocabularies);
router.post("/", vocabularyController.postVocabularies);
router.delete("/", vocabularyController.deleteVocabularies);

module.exports = router;
