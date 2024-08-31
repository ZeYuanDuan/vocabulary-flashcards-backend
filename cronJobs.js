const cron = require("node-cron");
const publicController = require("./controllers/public-controller.js");

function setupCronJobs() {
  // * 收集明日的每日單字
  // ! 注意 Render 伺服器正在運行，多伺服器執行此任務會有衝突
  cron.schedule(
    "10 00 * * *",
    async () => {
      await publicController.fetchAndStoreRawVocabularies();
      await publicController.fetchAndStoreVocabularyDetails();
      console.log("明日單字已準備完畢");
    },
    {
      scheduled: true,
      timezone: "Asia/Taipei",
    }
  );

  // * 更新每日單字
  // ! 注意 Render 伺服器正在運行，多伺服器執行此任務會有衝突
  cron.schedule(
    "00 00 * * *",
    async () => {
      await publicController.updateDailyVocabularies();
      console.log("每日單字已更新完畢");
    },
    {
      scheduled: true,
      timezone: "Asia/Taipei",
    }
  );
}

module.exports = setupCronJobs;
