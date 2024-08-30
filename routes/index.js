const express = require("express");

const authRouter = require("./api/auth.js");
const usersRouter = require("./api/users.js");
const publicRouter = require("./api/public.js");
const vocabulariesRouter = require("./api/vocabularies.js");

const authHandler = require("../middlewares/authHandler.js");

const router = express.Router();

// API 版本前綴
const apiPrefix = "/api/v1";

// 路由設置
router.use(`${apiPrefix}/auth`, authRouter);
router.use(`${apiPrefix}/users`, usersRouter);
router.use(`${apiPrefix}/public`, publicRouter);
router.use(`${apiPrefix}/vocabularies`, authHandler, vocabulariesRouter);

module.exports = router;
