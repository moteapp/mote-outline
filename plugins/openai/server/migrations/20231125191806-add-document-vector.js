"use strict";

const pgvector = require("pgvector/sequelize");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query("CREATE EXTENSION IF NOT EXISTS vector");
    pgvector.registerType(Sequelize);
    await queryInterface.createTable("document_vectors", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      collectionId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      documentId: {
        type: Sequelize.UUID
      },
      teamId: {
        type: Sequelize.UUID
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      embedding: {
        type: Sequelize.DataTypes.VECTOR(1536),
        allowNull: false
      }
    });
  },
  down: async queryInterface => {
    await queryInterface.dropTable("document_vectors");
  }
};