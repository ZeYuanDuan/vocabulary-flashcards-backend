'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Local_User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Local_User.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  }
  Local_User.init(
    {
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
        type: DataTypes.BIGINT,
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
<<<<<<< HEAD
      tableName: "local_users",
=======
>>>>>>> 9dd2529f18aa14f9a26720dca6317c915920cc88
    }
  );
  return Local_User;
};