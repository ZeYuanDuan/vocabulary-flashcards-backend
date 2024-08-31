const express = require("express");
const router = express.Router();
const publicController = require("../../controllers/public-controller.js");

router.get("/daily-vocabularies", publicController.getDailyVocabularies);

module.exports = router;
