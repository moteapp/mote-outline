"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex("document_vectors", ["teamId", "documentId"]);
    await queryInterface.addIndex("document_vectors", ["collectionId"]);
  },
  down: async queryInterface => {
    await queryInterface.removeIndex("document_vectors", ["collectionId"]);
    await queryInterface.removeIndex("document_vectors", ["teamId", "documentId"]);
  }
};