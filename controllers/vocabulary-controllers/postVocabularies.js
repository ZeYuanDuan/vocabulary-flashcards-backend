const db = require("../../models/mysql");
const { redisClient } = require("../../models/redis");
const Vocabulary = db.Vocabulary;

async function postVocabularies(req, res, next) {
  const { english, chinese, definition, example } = req.body;

  if (!english) {
    return res.status(400).json({ message: "未加入英文單字" });
  }

  const userId = req.user.id;
  const dataField = {
    english,
    chinese,
    definition,
    example,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const perfStart = performance.now(); // ! 測試用
    const mysqlField = await Vocabulary.create(dataField);
    const { id } = mysqlField;
    const { userId, ...dataWithoutUserId } = dataField;
    const redisFieldWithId = { id, ...dataWithoutUserId };

    const userVocStorageKey = `user:${userId}:vocabularies:storage`;
    await redisClient.incr(userVocStorageKey);
    const userVocStorage = await redisClient.get(userVocStorageKey);

    res.status(200).json({
      message: "單字儲存成功",
      vocabularyId: id,
      vocStorage: userVocStorage,
    });
    const perfEnd = performance.now(); // ! 測試用
    console.log(`Redis 讀取耗時: ${perfEnd - perfStart} ms`); // ! 測試用

    const filteredRedisFieldWithId = Object.entries(redisFieldWithId).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    console.log("filteredRedisFieldWithId", filteredRedisFieldWithId);

    setImmediate(async () => {
      try {
        // 更新 Redis 單字資料
        const key = `user:${userId}:vocabularies:${id}`;
        const redisFieldPromise = Object.entries(filteredRedisFieldWithId).map(
          ([field, value]) =>
            redisClient.hSet(key, field, JSON.stringify(value))
        );
        await Promise.all(redisFieldPromise);

        // 將單字 ID 加入用戶單字列表
        const userVocabulariesKey = `user:${userId}:vocabularies`;
        await redisClient.rPush(userVocabulariesKey, id.toString());
      } catch (redisError) {
        console.error("更新 Redis 時出現錯誤：", redisError);
        // ! 將更新 Redis 的錯誤訊息，集中在 Redis 當中處理
        await redisClient.rPush(
          "errorQueue",
          JSON.stringify({
            action: "postVocabularies",
            userId,
            dataField: redisFieldWithId,
            error: redisError.message,
          })
        );
      }
    });
  } catch (error) {
    console.error("更新 Redis 出現錯誤：", error);
    next(error);
  }
}

module.exports = postVocabularies;
