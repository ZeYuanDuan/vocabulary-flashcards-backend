const express = require("express");
const router = express.Router();

const db = require("../models");
const User = db.User;
const Vocabulary = db.Vocabulary;

const authHandler = require("../middlewares/authHandler");

