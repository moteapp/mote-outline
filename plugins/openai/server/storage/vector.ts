import path from 'path';
import {
    createDatabaseInstance,
    createMigrationRunner,
} from '@server/storage/database';
import env from '../env';
import { DocumentVector } from '../models/DocumentVector';

export const sequelize = env.DATABASE_URL_VECTOR
    ? createDatabaseInstance(env.DATABASE_URL_VECTOR, {
          DocumentVector,
      })
    : null;

export const migrations = sequelize
    ? createMigrationRunner(sequelize, [
          'migrations/*.js',
          {
              cwd: path.resolve('plugins/openai/server'),
          },
      ])
    : null;
