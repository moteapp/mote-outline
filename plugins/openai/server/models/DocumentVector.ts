import pgsequelize from 'pgvector/sequelize';
import sequelize, { QueryTypes } from 'sequelize';
import { Column, DataType, Table } from 'sequelize-typescript';
import { User } from '@server/models';
import IdModel from '@server/models/base/IdModel';
import Fix from '@server/models/decorators/Fix';

pgsequelize.registerType(sequelize);

@Table({ tableName: 'document_vectors', modelName: 'document_vector' })
@Fix
export class DocumentVector extends IdModel {
    @Column(DataType.UUID)
    documentId: string;

    @Column(DataType.UUID)
    teamId: string;

    @Column(DataType.UUID)
    collectionId: string;

    // @ts-expect-error VECTOR is registered in `registerType` above.
    @Column(DataType.VECTOR(1536))
    embedding: number[];

    @Column(DataType.BIGINT)
    offset: number;

    @Column(DataType.BIGINT)
    length: number;

    static async getEmbeddingById(documentId: string) {
        const vector = await DocumentVector.findByPk(documentId, {
            attributes: ['embedding'],
        });
        return vector?.embedding;
    }

    static async search(user: User, embedding: number[], options: any) {
        const { limit = 3 } = options;
        let collectionIds;
        if (options.collectionId) {
            collectionIds = [options.collectionId];
        } else {
            collectionIds = await user.collectionIds();
        }
        let dateFilter;
        if (options.dateFilter) {
            dateFilter = '1 '.concat(options.dateFilter);
        }
        const whereClause = '\n    "teamId" = :teamId AND\n    '
            .concat(
                options.dateFilter
                    ? '"updatedAt" > now() - interval :dateFilter AND'
                    : '',
                '\n    '
            )
            .concat(
                collectionIds.length ? '"collectionId" IN(:collectionIds)' : '',
                '\n    '
            );
        const results = await this.sequelize!.query<DocumentVector>(
            'SELECT "id", "teamId", "documentId", "collectionId", "offset", "length", embedding <=> \'['
                .concat(
                    embedding.toString(),
                    "]' AS dist\n      FROM document_vectors\n      WHERE "
                )
                .concat(
                    whereClause,
                    '\n      ORDER BY dist ASC \n      LIMIT :limit'
                ),
            {
                replacements: {
                    teamId: user.teamId,
                    userId: user.id,
                    collectionIds,
                    dateFilter,
                    limit,
                },
                type: QueryTypes.SELECT,
            }
        );
        return results.map((row) =>
            this.build({
                ...row,
                offset: Number(row.offset),
                length: Number(row.length),
            })
        );
    }
}
