// * 引入 moment-timezone 庫，用於時間轉換
const moment = require("moment-timezone");

// 從 UTC 轉換到台北時間
function convertUtcToTaipeiTime(utcTime) {
  return moment.tz(utcTime, "UTC").tz("Asia/Taipei").toDate();
}

module.exports = {
  convertUtcToTaipeiTime,
};

// ! MySQL 和 Redis 將資料以 UTC 時間儲存，如果要將資料以台北時間顯示，請使用此函式轉換
