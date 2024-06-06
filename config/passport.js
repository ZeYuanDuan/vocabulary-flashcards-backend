const passport = require("passport");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcryptjs");

const db = require("../models");

const User = db.User;
const Vocabulary = db.Vocabulary;

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (username, password, done) => {
      return User.findOne({
        attributes: ["id", "name", "email", "password"],
        where: { email: username },
        raw: true,
      }).then((user) => {
        if (!user) {
          return done(null, false, { message: "Email 或密碼錯誤" });
        }
        return bcrypt
          .compare(password, user.password)
          .then((isMatch) => {
            if (!isMatch) {
              return done(null, false, { message: "Email 或密碼錯誤" });
            }
            return done(null, user);
          })
          .catch((error) => {
            error.message = "bcrypt compare error";
            return done(error);
          });
      });
    }
  )
);

passport.serializeUser((user, done) => {
  const { id, name, email } = user;
  return done(null, { id, name, email });
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;
