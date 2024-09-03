function generateTranslateURL(keywords) {
  const baseUrl = "https://translation.googleapis.com/language/translate/v2";
  const params = new URLSearchParams({
    target: "zh-TW",
    key: process.env.GOOGLE_TRANSLATION_KEY,
  });

  keywords.forEach((keyword) => params.append("q", keyword));

  return `${baseUrl}?${params.toString()}`;
}

module.exports = {
  generateTranslateURL,
};
