// * 請求失敗後重試
const axios = require("axios");

const fetchWithRetry = async (url, retries = 10) => {
  let attempts = 0;
  while (attempts < retries) {
    try {
      const response = await axios.get(url);
      return response;
    } catch (error) {
      if (
        error.response &&
        error.response.status === 429 &&
        attempts < retries - 1
      ) {
        const retryAfter = error.response.headers["retry-after"];
        const waitTime = (retryAfter ? parseInt(retryAfter) : 60) * 1000;
        console.log(
          `Rate limit exceeded. Retrying after ${waitTime / 1000} seconds.`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        attempts++;
      } else {
        throw error;
      }
    }
  }
};

module.exports = fetchWithRetry;
