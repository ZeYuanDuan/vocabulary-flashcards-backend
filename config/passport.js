const passport = require("passport");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcryptjs");

const db = require("../models");

const User = db.User;
const Vocabulary = db.Vocabulary;

// passport.use(
//   new LocalStrategy(
//     { usernameField: "email" },
//     async (username, password, done) => {
//       return User.findOne({
//         attributes: ["id", "name", "email", "password"],
//         where: { email: username },
//         raw: true,
//       })
//         .then((user) => {
//           if (!user) {
//             return done(null, false, { message: "Email 或密碼錯誤" });
//           }
//           return bcrypt
//             .compare(password, user.password)
//             .then((isMatch) => {
//               if (!isMatch) {
//                 return done(null, false, { message: "Email 或密碼錯誤" });
//               }
//               return done(null, user);
//             })
//             .catch((error) => {
//               error.message = "bcrypt compare error";
//               return done(error);
//             });
//         })
//         .catch((error) => {
//           error.message = "登入失敗";
//           return done(error);
//         });
//     }
//   )
// );

const strategy = new LocalStrategy(
  { usernameField: "email" },
  (username, password, done) => {
    return User.findOne({
      attributes: ["id", "name", "email", "password"],
      where: { email: username },
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
            error.message = "bcrypt compare error";
            return done(error);
          });
      })
      .catch((error) => {
        error.message = "登入失敗";
        return done(error);
      });
  }
);

passport.use(strategy);

passport.serializeUser((user, done) => {
  const { id, name, email } = user;
  return done(null, { id, name, email });
});
passport.deserializeUser((user, done) => {
  done(null, { id: user.id, name: user.name });
});

module.exports = passport;
