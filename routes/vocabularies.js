const express = require("express");
const router = express.Router();

const db = require("../models");
const Vocabulary = db.Vocabulary;

router.get("/", async (req, res) => {
  // 確認使用者是否登入
  if (!userID) {
    return res.status(400).json({ message: "請先登入" });
  }

  // 在資料庫尋找使用者，調出english, chinese, definition, example，回傳給前端。
  try {
    const userID = req.user.id;
    const vocabularies = await Vocabulary.findAll({
      where: {
        userID,
      },
      attributes: ["english", "chinese", "definition", "example"],
    });
    return res.status(200).json(vocabularies);
  } catch (error) {
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

router.post("/", async (req, res) => {
  // 傳入english, chinese, definition, example給後端，將其儲存於資料庫
  const { english, chinese, definition, example } = req.body;
  try {
    const userID = req.user.id;
    await Vocabulary.create({
      english,
      chinese,
      definition,
      example,
      userID,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // 回傳成功訊息給前端
    return res.status(201).json({ message: "單字新增成功" });
  } catch (error) {
    return res.status(500).json({ message: "伺服器錯誤" });
  }
});

router.delete("/:word", async (req, res) => {
  // 請求 query 中帶有 word，從使用者資料庫刪除單字
  const { word } = req.params;
  try {
    const userID = req.user.id;
    const deleteResult = await Vocabulary.destroy({
      where: {
        userID,
        english: word,
      },
    });

    if (deleteResult) {
      return res.json({ message: `單字 ${word} 刪除成功` });
    } else {
      return res.status(404).json({ message: `找不到單字 ${word}` });
    }
  } catch (error) {
    return res.status(500).json({ message: "伺服器錯誤" });
  }
});

module.exports = router;
