const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20");
const passportJWT = require("passport-jwt");
const bcrypt = require("bcryptjs");

const db = require("../models/mysql");
const { User, Local_User, Google_User } = db;

require("dotenv").config();

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

passport.serializeUser((user, done) => {
  const { userId } = user;
  return done(null, { userId });
});
passport.deserializeUser((user, done) => {
  return User.findByPk(user.userId).then((user) => {
    done(null, { id: user.id, name: user.name });
  });
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (email, password, done) => {
      return Local_User.findOne({
        attributes: ["email", "password", "userId"],
        where: { email },
        raw: true,
      })
        .then((user) => {
          if (!user) {
            return done(null, false, { error_message: "使用者不存在" });
          }
          bcrypt
            .compare(password, user.password)
            .then((isMatch) => {
              if (!isMatch) {
                return done(null, false, { error_message: "Email 或密碼錯誤" });
              }
              return done(null, user, { success_message: "歡迎登入" });
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
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      const googleId = profile.id;
      const email = profile.emails[0].value;
      const name = profile.displayName;

      console.log(
        "從 Google 拿到的資料：",
        `googleId: ${googleId}, email: ${email}, name: ${name}`
      ); //測試用

      return Google_User.findOne({
        attributes: ["email", "googleId", "userId"],
        where: { googleId },
        raw: true,
      }).then((user) => {
        if (user) return done(null, user, { success_message: "歡迎登入" });

        return User.create({ name })
          .then((user) => {
            return Google_User.create({
              email,
              googleId,
              userId: user.id,
            })
              .then((user) => done(null, user, { success_message: "歡迎登入" }))
              .catch((error) => {
                console.error(error);
                error.message = "建立 Google 使用者失敗";
                return done(error);
              });
          })
          .catch((error) => {
            console.error(error);
            error.message = "建立使用者失敗";
            return done(error);
          });
      });
    }
  )
);

const jwtOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JWTStrategy(jwtOptions, async (jwtPayload, done) => {
    const userId = jwtPayload.userId;
    return User.findByPk(userId)
      .then((user) => {
        if (!user) return done(null, false);
        return done(null, user);
      })
      .catch((error) => {
        console.error(error);
        return done(error);
      });
  })
);

module.exports = passport;
