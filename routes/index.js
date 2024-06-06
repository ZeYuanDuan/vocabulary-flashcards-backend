const express = require("express");
const router = express.Router();

const passport = require("passport");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcryptjs");

const db = require("../models");
const User = db.User;
const Box = db.Box;

const authHandler = require("../middlewares/authHandler");
