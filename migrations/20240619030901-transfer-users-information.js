'use strict';

const { User, Local_User, Google_User } = require("../models");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
    const users = await User.findAll();

    for (let user of users) {
      if (user.provider === "local") {
        await Local_User.create({
          email: user.email,
          password: user.password,
          userId: user.id,
        });
      } else if (user.provider === "google") {
        await Google_User.create({
          email: user.email,
          googleId: user.googleId,
          userId: user.id,
        });
      }
    }
    } catch (error) {
      console.error(error);
    }
  },


  async down (queryInterface, Sequelize) {
    try {
      const localUsers = await Local_User.findAll();
      const googleUsers = await Google_User.findAll();

      // Restore data to the users table
      for (let localUser of localUsers) {
        await User.update(
          {
            email: localUser.email,
            password: localUser.password,
            provider: "local",
          },
          { where: { id: localUser.userId } }
        );
      }

      for (let googleUser of googleUsers) {
        await User.update(
          {
            email: googleUser.email,
            googleId: googleUser.googleId,
            provider: "google",
          },
          { where: { id: googleUser.userId } }
        );
      }

      await queryInterface.bulkDelete("local_users", null, {});
      await queryInterface.bulkDelete("google_users", null, {});
    } catch (error) {
      console.error(error);
    }
  }
};
