'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "email");
    await queryInterface.removeColumn("users", "password");
    await queryInterface.removeColumn("users", "googleId");
    await queryInterface.removeColumn("users", "provider");
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "email", {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        isEmail: {
          msg: "存入資料庫前的最後驗證：Email 格式錯誤！",
        },
      },
    });
    await queryInterface.addColumn("users", "password", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("users", "googleId", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn("users", "provider", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "local",
    });
  }
};
