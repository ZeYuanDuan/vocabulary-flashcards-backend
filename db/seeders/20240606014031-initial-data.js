"use strict";

const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let transaction;

    try {
      transaction = await queryInterface.sequelize.transaction();
      const salt = await bcrypt.genSalt(10);
      const hash1 = await bcrypt.hash("password1", salt);
      const hash2 = await bcrypt.hash("password2", salt);

      await queryInterface.bulkInsert(
        "Users",
        [
          {
            id: 1,
            name: "JohnDoe",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            name: "JaneSmith",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction }
      );
            await queryInterface.bulkInsert(
              "Local_Users",
              [
                {
                  id: 1,
                  email: "john.doe@example.com",
                  password: hash1,
                  userId: 1,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
                {
                  id: 2,
                  email: "jane.smith@example.com",
                  password: hash2,
                  userId: 2,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ],
              { transaction }
            );

      await queryInterface.bulkInsert(
        "Vocabularies",
        [
          {
            english: "apple",
            chinese: "蘋果",
            userID: 1,
            example: "An apple a day keeps the doctor away.",
            definition:
              "A fruit that is typically round and red, green, or yellow.",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            english: "banana",
            chinese: "香蕉",
            userID: 2,
            example: "Bananas are high in potassium.",
            definition:
              "A long curved fruit that grows in clusters and has soft pulpy flesh and yellow skin when ripe.",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    let transaction;
    try {
      transaction = await queryInterface.sequelize.transaction();

      await queryInterface.bulkDelete("Vocabularies", null, { transaction });
      await queryInterface.bulkDelete("Local_Users", null, { transaction });
      await queryInterface.bulkDelete("Users", null, { transaction });

      await transaction.commit();
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  },
};
