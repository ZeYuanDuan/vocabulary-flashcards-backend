const express = require("express");
const router = express.Router();

const vocabularies = require("./vocabularies");
const users = require("./users");

const homeController = require("../controllers/home-controller");
const authController = require("../controllers/auth-controller");

const authHandler = require("../middlewares/authHandler");

router.use("/vocabularies", authHandler, vocabularies);
router.use("/users", users);


router.post("/login", authController.postLogin);
router.post("/logout", authController.postLogout);
router.get("/", authHandler, homeController.getHomePage);

module.exports = router;
