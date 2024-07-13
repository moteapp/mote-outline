"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("document_vectors", "offset", {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn("document_vectors", "length", {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0
    });
  },
  down: async queryInterface => {
    await queryInterface.removeColumn("document_vectors", "length");
    await queryInterface.removeColumn("document_vectors", "offset");
  }
};