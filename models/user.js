"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.BIGINT,
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
            args: [1, 12],
            msg: "存入資料庫前的最後驗證：名稱長度需少於 12 個字元！",
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: {
            msg: "存入資料庫前的最後驗證：Email 格式錯誤！",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "local",
      },
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate: (user, option) => {
          if (user.provider === "google" && !user.googleId) {
            throw new Error("使用 Google 驗證者，必須輸入 googleId");
          }
        },
      },
      beforeUpdate: (user, option) => {
        if (user.provider === "google" && !user.googleId) {
          throw new Error("使用 Google 驗證者，必須輸入 googleId");
        }
      },
    }
  );

  return User;
};