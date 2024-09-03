"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Local_User extends Model {
    static associate(models) {
      Local_User.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  }
  Local_User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "Local_User",
      tableName: "Local_Users",
    }
  );
  return Local_User;
};
