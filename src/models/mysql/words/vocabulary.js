"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Vocabulary extends Model {
    static associate(models) {
      Vocabulary.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
      Vocabulary.belongsToMany(models.Tag, {
        through: models.Vocabulary_Tag,
        foreignKey: "vocabularyId",
        otherKey: "tagId",
        as: "tags",
      });
    }
  }
  Vocabulary.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      english: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "存入資料庫前的最後驗證：英文不得為空值",
          },
        },
      },
      chinese: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      example: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      definition: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Vocabulary",
      tableName: "Vocabularies",
    }
  );

  return Vocabulary;
};
