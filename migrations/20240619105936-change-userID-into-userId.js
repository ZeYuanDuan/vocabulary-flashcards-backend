'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("vocabularies");
    if (tableDescription.userID) {
      // 將 userID 欄位改為 userId
      await queryInterface.renameColumn("vocabularies", "userID", "userId");
    }
  },

  async down (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("vocabularies");
    if (tableDescription.userId) {
      await queryInterface.renameColumn("vocabularies", "userId", "userID");
    }
  }
};
