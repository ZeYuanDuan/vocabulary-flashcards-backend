const express = require("express");
const userController = require("../../controllers/user-controller.js");
const authHandler = require("../../middlewares/authHandler.js");

const router = express.Router();

router.post("/", userController.registerLocalUser);

router.get("/stats", authHandler, userController.getUserStatistics);

module.exports = router;
