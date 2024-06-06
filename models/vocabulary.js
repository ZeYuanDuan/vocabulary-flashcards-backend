"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Vocabulary extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Vocabulary.belongsTo(models.User, {
        foreignKey: "userID",
        as: "user",
      });
    }
  }
  Vocabulary.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      english: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      chinese: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userID: {
        type: DataTypes.BIGINT,
        allowNull: false,
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
    }
  );

  return Vocabulary;
};
