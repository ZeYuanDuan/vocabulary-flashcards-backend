"use strict";

const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let transaction;

    try {
      transaction = await queryInterface.sequelize.transaction();
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("ratatouille123", salt);

      // Users
      await queryInterface.bulkInsert(
        "Users",
        [
          {
            id: 1,
            name: "Linguini Remy", 
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction }
      );

      // Local_Users
      await queryInterface.bulkInsert(
        "Local_Users",
        [
          {
            id: 1,
            email: "linguini.remy@ratatouille.com",
            password: hash,
            userId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction }
      );

      // Vocabularies
      await queryInterface.bulkInsert(
        "Vocabularies",
        [
          {
            id: 1,
            english: "cheese",
            chinese: "乳酪",
            userId: 1,
            example: "Cheese is a great source of calcium.",
            definition: "A food made from the pressed curds of milk.",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            english: "wine",
            chinese: "葡萄酒",
            userId: 1,
            example: "Wine is often paired with cheese in French cuisine.",
            definition: "An alcoholic drink made from fermented grapes.",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction }
      );

      // Tags
      await queryInterface.bulkInsert(
        "Tags",
        [
          {
            id: 1,
            name: "French Cuisine",
            description: "Words related to French cuisine",
            userId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            name: "Dairy",
            description: "Words related to dairy products",
            userId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 3,
            name: "Beverages",
            description: "Words related to drinks and beverages",
            userId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction }
      );

      // Vocabulary_Tags
      await queryInterface.bulkInsert(
        "Vocabulary_Tags",
        [
          {
            id: 1,
            tagId: 1, // French Cuisine
            vocabularyId: 1, // cheese
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            tagId: 1, 
            vocabularyId: 2, // wine
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 3,
            tagId: 2, // Dairy
            vocabularyId: 1, // cheese
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 4,
            tagId: 3, // Beverages
            vocabularyId: 2, // wine
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

      await queryInterface.bulkDelete("Vocabulary_Tags", null, { transaction });
      await queryInterface.bulkDelete("Tags", null, { transaction });
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
