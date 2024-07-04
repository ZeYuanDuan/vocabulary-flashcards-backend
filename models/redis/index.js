const { createClient } = require("redis");
const RedisStore = require("connect-redis").default;

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

// 連接 Redis
redisClient.connect().catch((err) => {
  console.error(err);
});

module.exports = { redisClient, RedisStore };
