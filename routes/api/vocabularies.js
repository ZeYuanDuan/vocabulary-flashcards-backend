const express = require("express");
const router = express.Router();

const vocabularyController = require("../../controllers/vocabulary-controllers/index");

router.get("/", vocabularyController.getVocabularies);
router.get("/simple", vocabularyController.getSimpleVocabularies); // ! 這個路由有狀況
router.post("/", vocabularyController.postVocabularies);
router.patch("/:id", vocabularyController.patchVocabularies);
router.delete("/:id", vocabularyController.deleteVocabularies);

module.exports = router;
