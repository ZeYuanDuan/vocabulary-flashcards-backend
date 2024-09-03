const express = require("express");
const publicController = require("../../controllers/public-controller.js");

const router = express.Router();

router.get("/daily-vocabularies", publicController.getDailyVocabularies);

module.exports = router;
