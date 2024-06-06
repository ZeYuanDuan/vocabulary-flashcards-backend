const express = require("express");
const session = require("express-session");
const passport = require("passport");
// const router = require("./routes");

const app = express();

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const port = process.env.PORT || 3000;

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// app.use(passport.initialize());
// app.use(passport.session());

// app.use(router);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
