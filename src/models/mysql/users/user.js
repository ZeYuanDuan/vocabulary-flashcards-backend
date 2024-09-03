"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Local_User, { foreignKey: "userId", as: "localUser" });
      User.hasOne(models.Google_User, {
        foreignKey: "userId",
        as: "googleUser",
      });
      User.hasMany(models.Vocabulary, {
        foreignKey: "userId",
        as: "vocabularies",
        onDelete: "CASCADE",
      });
      User.hasMany(models.Tag, {
        foreignKey: "userId",
        as: "tags",
        onDelete: "CASCADE",
      });
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [1, 50],
            msg: "存入資料庫前的最後驗證：名稱長度需少於 50 個字元！",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
    }
  );

  return User;
};
