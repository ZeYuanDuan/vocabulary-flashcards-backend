const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20")
const bcrypt = require("bcryptjs");

const db = require("../models");
const User = db.User;

require("dotenv").config();

passport.serializeUser((user, done) => {
  const { id, name } = user;
  return done(null, { id, name });
});
passport.deserializeUser((user, done) => {
  done(null, { id: user.id, name: user.name });
});

passport.use(
  new LocalStrategy({ usernameField: "email" }, (username, password, done) => {
    return User.findOne({
      attributes: ["id", "name", "email", "password", "provider"],
      where: { email: username, provider: "local"},
      raw: true,
    })
      .then((user) => {
        if (!user) {
          return done(null, false, { message: "使用者不存在" });
        }
        return bcrypt
          .compare(password, user.password)
          .then((isMatch) => {
            if (!isMatch) {
              return done(null, false, { message: "Email 或密碼錯誤" });
            }
            return done(null, user, { message: "歡迎登入" });
          })
          .catch((error) => {
            console.error(error);
            error.message = "bcrypt 比對密碼失敗";
            return done(error);
          });
      })
      .catch((error) => {
        console.error(error);
        error.message = "登入失敗";
        return done(error);
      });
  })
);

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
},
  async (accessToken, refreshToken, profile, done) => {
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.displayName;

    console.log(`googleId: ${googleId}, email: ${email}, name: ${name}`);

    return User.findOne({
      attributes: ["id", "name", "email", "googleId", "provider"],
      where: { googleId, provider: "google" },
      raw: true,
    })
      .then((user) => {
        if (user) return done(null, user);

        const randomPassword = Math.random().toString(36).slice(-8);

        return bcrypt
          .hash(randomPassword, 10)
          .then((hash) =>
            User.create({
              name,
              email,
              password: hash,
              googleId,
              provider: "google",
            })
          )
          .then((user) => done(null, user, { message: "歡迎登入" }));
      })
      .catch((error) => {
        console.error(error);
        error.message = "登入失敗";
        return done(error);
      });
  }
))


module.exports = passport;
