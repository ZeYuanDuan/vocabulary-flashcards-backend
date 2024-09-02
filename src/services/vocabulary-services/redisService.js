const { redisClient } = require("../../models/redis");

const KEYS = {
  USER_VOCABULARIES: (userId) => `user:${userId}:vocabularies`,
  USER_VOCABULARIES_COUNT: (userId) => `user:${userId}:vocabularies:count`,
  USER_SIMPLE_VOCABULARIES: (userId, start, end) =>
    `user:${userId}:simpleVocabularies:${start}-${end}`,
  ERROR_QUEUE: "errorQueue",
};

const EXPIRATION_TIME = 3600; // 1 hour in seconds

const getVocabulariesFromCache = async (userId) => {
  return await redisClient.json.get(KEYS.USER_VOCABULARIES(userId));
};

const getUserSimpleVocabularies = async (userId, start, end) => {
  const key = KEYS.USER_SIMPLE_VOCABULARIES(userId, start, end);
  return await redisClient.json.get(key);
};

const setVocabulariesToCache = async (userId, vocabularies) => {
  const key = KEYS.USER_VOCABULARIES(userId);
  await redisClient.json.set(key, ".", JSON.stringify(vocabularies));
  await redisClient.expire(key, EXPIRATION_TIME);
};

const setSimpleVocabulariesToCache = async (
  userId,
  start,
  end,
  vocabularies
) => {
  const key = KEYS.USER_SIMPLE_VOCABULARIES(userId, start, end);
  await redisClient.json.set(key, ".", JSON.stringify(vocabularies));
  await redisClient.expire(key, EXPIRATION_TIME);
};

const deleteVocabulariesFromCache = async (userId) => {
  await redisClient.del(KEYS.USER_VOCABULARIES(userId));
};

const getVocabulariesCount = async (userId) => {
  return await redisClient.get(KEYS.USER_VOCABULARIES_COUNT(userId));
};

const setVocabulariesCount = async (userId, count) => {
  await redisClient.set(
    KEYS.USER_VOCABULARIES_COUNT(userId),
    count,
    "EX",
    EXPIRATION_TIME
  );
};

const incrementVocabulariesCount = async (userId) => {
  await redisClient.incr(KEYS.USER_VOCABULARIES_COUNT(userId));
};

const decrementVocabulariesCount = async (userId) => {
  await redisClient.decr(KEYS.USER_VOCABULARIES_COUNT(userId));
};

const pushToErrorQueue = async (error) => {
  await redisClient.rPush(KEYS.ERROR_QUEUE, JSON.stringify(error));
};

module.exports = {
  getVocabulariesFromCache,
  setVocabulariesToCache,
  deleteVocabulariesFromCache,
  getVocabulariesCount,
  setVocabulariesCount,
  incrementVocabulariesCount,
  decrementVocabulariesCount,
  pushToErrorQueue,
  getUserSimpleVocabularies,
  setSimpleVocabulariesToCache,
};
