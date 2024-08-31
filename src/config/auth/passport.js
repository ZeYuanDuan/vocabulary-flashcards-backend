const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20");
const passportJWT = require("passport-jwt");
const bcrypt = require("bcryptjs");
const db = require("../../models/mysql");
const { User, Local_User, Google_User } = db;
require("dotenv").config();

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

// 序列化和反序列化用戶
passport.serializeUser((user, done) => {
  const { userId } = user;
  return done(null, { userId });
});

passport.deserializeUser((user, done) => {
  return User.findByPk(user.userId).then((user) => {
    done(null, { id: user.id, name: user.name });
  });
});

// 本地策略
passport.use(new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
  },
  async (email, password, done) => {
    try {
      const user = await Local_User.findOne({
        attributes: ["email", "password", "userId"],
        where: { email },
        raw: true,
      });

      if (!user) {
        return done(null, false, { error_message: "使用者不存在" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { error_message: "Email 或密碼錯誤" });
      }

      return done(null, user, { success_message: "歡迎登入" });
    } catch (error) {
      console.error(error);
      error.message = "登入失敗";
      return done(error);
    }
  }
));

// Google 策略
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const { id: googleId, emails, displayName: name } = profile;
      const email = emails[0].value;

      console.log("從 Google 拿到的資料：", `googleId: ${googleId}, email: ${email}, name: ${name}`);

      let user = await Google_User.findOne({
        attributes: ["email", "googleId", "userId"],
        where: { googleId },
        raw: true,
      });

      if (user) {
        return done(null, user, { success_message: "歡迎登入" });
      }

      const newUser = await User.create({ name });
      user = await Google_User.create({
        email,
        googleId,
        userId: newUser.id,
      });

      return done(null, user, { success_message: "歡迎登入" });
    } catch (error) {
      console.error(error);
      error.message = "Google 登入失敗";
      return done(error);
    }
  }
));

// JWT 策略
const jwtOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(new JWTStrategy(jwtOptions, async (jwtPayload, done) => {
  try {
    const user = await User.findByPk(jwtPayload.userId);
    if (!user) return done(null, false);
    return done(null, user);
  } catch (error) {
    console.error(error);
    return done(error);
  }
}));

module.exports = passport;
