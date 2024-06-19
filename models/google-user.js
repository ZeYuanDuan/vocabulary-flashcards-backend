'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Google_User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Google_User.belongsTo(models.User, { foreignKey: "userId", as:"user" });
    }
  }
  Google_User.init(
    {
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
<<<<<<< HEAD
      tableName: "google_users",
=======
>>>>>>> 9dd2529f18aa14f9a26720dca6317c915920cc88
    }
  );
  return Google_User;
};