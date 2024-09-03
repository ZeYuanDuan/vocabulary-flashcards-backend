const moment = require("moment-timezone");

const getCurrentDateInTaipei = () => {
  return moment().tz("Asia/Taipei");
};

const getFormattedDateForTomorrow = () => {
  const today = getCurrentDateInTaipei();
  const tomorrow = moment(today).add(1, "day");
  return tomorrow.format("YYYY-MM-DD");
};

module.exports = {
  getCurrentDateInTaipei,
  getFormattedDateForTomorrow,
};
