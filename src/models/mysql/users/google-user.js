"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Google_User extends Model {
    static associate(models) {
      Google_User.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  }
  Google_User.init(
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
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
      modelName: "Google_User",
      tableName: "Google_Users",
    }
  );
  return Google_User;
};
