// * 取得台北時間
const moment = require("moment-timezone");

const getTaipeiTime = () => {
  return moment.tz(new Date(), "Asia/Taipei").toDate();
};

module.exports = {
  getTaipeiTime,
};

// ! 引入這個函式，在 MySQL 伺服器的時間還是不正確，後續更新再解決這個問題
