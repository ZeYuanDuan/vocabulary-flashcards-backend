const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv");

const corsOptions = require("./config/corsOptions.js");
const router = require("./routes/index.js");
const errorHandler = require("./middlewares/errorHandler.js");
const setupCronJobs = require("./cronJobs.js");

// 環境變量配置
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();
const port = process.env.PORT || 3000;

// 中間件設置
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由設置
app.use(router);

// 錯誤處理
app.use(errorHandler);

// 初始化定時任務
setupCronJobs();

// 啟動伺服器
app.listen(port, "0.0.0.0", () => {
  console.log(`伺服器正在運行......`);
});

module.exports = app;
