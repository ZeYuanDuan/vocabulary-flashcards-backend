require("dotenv").config();

// **提示**: 為了確保不同環境（例如開發環境、測試環境和生產環境）使用不同的資料庫，請為每個環境設定各自的環境變數。
// 例如，您可以為開發環境設定 `DB_NAME`，為測試環境設定 `DB_TEST_NAME`，為生產環境設定 `DB_PROD_NAME`。
// 這樣做有助於避免數據混淆，並且提高應用程序的穩定性和安全性。

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql",
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql",
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql",
  },
};
