const axios = require("axios");
const fetchWithRetry = require("./utils/fetchWithRetry");
const {
  generateWordnikURL,
  generateDefinitionURL,
  generateExampleURL,
} = require("../../apiHelpers/wordnik");
const { generateTranslateURL } = require("../../apiHelpers/googleTranslate");
const { getFormattedDateForTomorrow } = require("./utils/timeUtils");

const WAIT_TIME_MS = 20000; // 等 20 秒
const NO_DEFINITION_MSG = "No definition available";
const NO_EXAMPLE_MSG = "No example available";

const processWordnikData = async () => {
  const wordnikURL = generateWordnikURL();
  const { data } = await axios.get(wordnikURL);
  const filteredData = data.map(({ id, ...keepAttrs }) => keepAttrs);
  const wordSequence = filteredData.map((obj) => obj.word);

  const { data: translationData } = await fetchWithRetry(
    generateTranslateURL(wordSequence)
  );

  const formattedDate = getFormattedDateForTomorrow();

  const combinedArray = filteredData.map((obj, index) => ({
    date: formattedDate,
    data: {
      english: obj.word,
      chinese: translationData.data.translations[index].translatedText,
    },
  }));

  return combinedArray;
};

const processVocabularyDetails = async (DailyVocab) => {
  const vocabularyDetails = [];

  for (const { date, data } of DailyVocab) {
    const { english, chinese } = data;
    const { data: defData } = await fetchWithRetry(
      generateDefinitionURL(english)
    );
    const rawDefinition = defData.find((def) => def?.text)?.text;
    const definition = rawDefinition
      ? Array.isArray(rawDefinition)
        ? rawDefinition.join(", ").replace(/<[^>]*>/g, "")
        : rawDefinition.replace(/<[^>]*>/g, "")
      : NO_DEFINITION_MSG;

    const { data: exampleData } = await fetchWithRetry(
      generateExampleURL(english)
    );
    const example = exampleData.text
      ? Array.isArray(exampleData.text)
        ? exampleData.text.join(", ")
        : exampleData.text
      : NO_EXAMPLE_MSG;

    vocabularyDetails.push({
      date: date,
      data: { english, chinese, definition, example },
    });

    await new Promise((resolve) => setTimeout(resolve, WAIT_TIME_MS));
  }

  return vocabularyDetails;
};

module.exports = {
  processWordnikData,
  processVocabularyDetails,
};
