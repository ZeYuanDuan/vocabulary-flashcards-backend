const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf } = format;

// 創建簡單的錯誤日誌記錄器
const errorLogger = createLogger({
  format: combine(
    timestamp(),
    printf(({ timestamp, message }) => {
      return `${timestamp}: ${message}`;
    })
  ),
  transports: [new transports.File({ filename: "error.log", level: "error" })],
});

module.exports = (err, req, res, next) => {
  // 記錄錯誤到日誌
  const userId = req.user ? req.user.id : "unknown";
  const action = `${req.method} ${req.path}`;
  const errorMessage = `用戶 ${userId} 在 ${action} 操作時發生錯誤: ${err.message}`;

  // 將錯誤訊息寫入日誌文件
  errorLogger.error(errorMessage);

  // 在終端機中印出完整的錯誤堆疊信息
  console.error(err.stack);

  // 回傳錯誤訊息給前端
  res.status(500).send({ message: "Server error", error: err.message });
};
