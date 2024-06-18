'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
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
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "googleId");
    await queryInterface.removeColumn("users", "provider");
  }
};
