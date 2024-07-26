const db = require("../../models/mysql");
const { redisClient } = require("../../models/redis");
const Vocabulary = db.Vocabulary;
const Tag = db.Tag;
const Vocabulary_Tag = db.Vocabulary_Tag;

const moment = require("moment-timezone");
const taipeiTime = moment.tz(new Date(), "Asia/Taipei").toDate();

const SYSTEM_TAG_PREFIX = "__";
const USER_TAG_PREFIX = "user_";

async function postVocabularies(req, res, next) {
  const { english, chinese, definition, example, tags } = req.body;

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
    createdAt: taipeiTime,
    updatedAt: taipeiTime,
  };

  try {
    const perfStart = performance.now(); // ! 測試用
    const mysqlField = await Vocabulary.create(dataField);
    const { id } = mysqlField;
    const { userId, ...dataWithoutUserId } = dataField;
    const redisFieldWithId = { id, ...dataWithoutUserId };
    console.log("redisFieldWithId: ", redisFieldWithId); // ! 測試用
    console.log("Tags：", tags); // ! 測試用

    // 處理標籤
    let tagList =
      Array.isArray(tags) && tags.length > 0
        ? tags.map((tag) => USER_TAG_PREFIX + tag)
        : [`${SYSTEM_TAG_PREFIX}NoTag`];
    for (const tagName of tagList) {
      let tag = await Tag.findOne({
        where: { name: tagName, userId: userId },
      });
      if (!tag) {
        tag = await Tag.create({ name: tagName, userId: userId });
      }
      await Vocabulary_Tag.create({ tagId: tag.id, vocabularyId: id });
      console.log("找到的資料庫標籤：", tag); // ! 測試用

      // 更新 Redis 標籤資料
      const tagKey = `user:${userId}:tags:${tag.id}`;
      const tagDetailsKey = `user:${userId}:tags:${tag.id}:details`;
      await redisClient.hSet(tagDetailsKey, "id", tag.id);
      await redisClient.hSet(tagDetailsKey, "name", tag.name);
      await redisClient.hSet(tagDetailsKey, "userId", tag.userId.toString());
      await redisClient.sAdd(tagKey, id.toString());

      // 將標籤 ID 加入用戶標籤列表
      const userTagsKey = `user:${userId}:tags`;
      await redisClient.sAdd(userTagsKey, tag.id.toString());
    }

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

    setImmediate(async () => {
      try {
        // 更新 Redis 單字資料
        const key = `user:${userId}:vocabularies:${id}`;
        const redisFieldPromise = Object.entries(
          filterUndefined(redisFieldWithId)
        ).map(([field, value]) =>
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
    await redisClient.rPush(
      "errorQueue",
      JSON.stringify({
        action: "postVocabularies",
        userId,
        error: error.message,
      })
    );
    next(error);
  }
}

// 輔助函數：過濾掉 undefined 的欄位
const filterUndefined = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

module.exports = postVocabularies;
