const express = require("express");
const cors = require("cors");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const redis = require("redis");
const { URL } = require("url");

const app = express();

// 解析 Redis URL
// const redisURL = new URL("redis://red-cpt37s2ju9rs73akch2g:6379");

// 創建 Redis 客戶端
const redisClient = redis.createClient({
  host: "red-cpt37s2ju9rs73akch2g",
  port: "6379",
  tls: {}, // Render.com Redis 預設需要使用 TLS
});

// 捕獲 Redis 客戶端的錯誤
redisClient.on('error', function(err) {
    console.error('Redis error: ', err);
});


const router = require("./routes");
const passport = require("./config/passport");
const errorHandler = require("./middlewares/errorHandler");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const port = process.env.PORT;

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://voc-memorize-project.onrender.com",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.set("trust proxy", 1);
app.use(cors(corsOptions));

(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    if (error instanceof AggregateError) {
      // Log individual errors
      for (const err of error.errors) {
        console.error(err);
      }
    }
  }
})();

async function testRedis() {
  await redisClient.set("test", "test");
  const test = await redisClient.get("test");
  console.log("test", test);
}
testRedis();

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      domain: ".onrender.com",
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(router);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
