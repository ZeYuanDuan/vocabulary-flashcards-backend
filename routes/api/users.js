const express = require("express");
const router = express.Router();

const userController = require("../../controllers/user-controller.js");

const authHandler = require("../../middlewares/authHandler.js");

router.post("/", userController.postUsers);

router.get("/stats", authHandler, userController.getUserHomePage);

module.exports = router;
