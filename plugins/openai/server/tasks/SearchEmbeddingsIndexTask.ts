import Logger from '@server/logging/Logger';
import { Team, User, Document } from '@server/models';
import BaseTask from '@server/queues/tasks/BaseTask';
import { SearchEmbeddingsCompleteEmail } from '../email/template/SearchEmbeddingsCompleteEmail';
import { DocumentVector } from '../models/DocumentVector';
import { SearchIndex } from '../searchIndex';

export interface SearchEmbeddingsIndexTaskProps {
    teamId: string;
    actorId: string;
}

export class SearchEmbeddingsIndexTask extends BaseTask<SearchEmbeddingsIndexTaskProps> {
    async perform(props: SearchEmbeddingsIndexTaskProps) {
        const { teamId, actorId } = props;

        let indexed = 0;
        const [team, actor] = await Promise.all([
            Team.findByPk(teamId, {
                rejectOnEmpty: true,
            }),
            User.findByPk(actorId, {
                rejectOnEmpty: true,
            }),
        ]);
        await Document.findAllInBatches<Document>(
            {
                where: {
                    teamId,
                },
                limit: 100,
                order: [['createdAt', 'ASC']],
            },
            async (documents) => {
                const documentVectors = await DocumentVector.findAll({
                    attributes: ['id', 'documentId', 'updatedAt'],
                    where: {
                        teamId,
                        documentId: documents.map((document) => document.id),
                    },
                });
                for (const document of documents) {
                    if (!document.content) {
                        Logger.debug('task', 'Skipping document without text', {
                            documentId: document.id,
                        });
                        continue;
                    }
                    const documentVector = documentVectors.find(
                        (vector) => vector.documentId === document.id
                    );
                    if (
                        !documentVector ||
                        documentVector.updatedAt < document.updatedAt
                    ) {
                        await SearchIndex.indexDocument(document);
                        indexed++;
                    }
                }
            }
        );

        if (indexed > 0) {
            await new SearchEmbeddingsCompleteEmail({
                teamUrl: team.url,
                userId: actor.id,
                to: actor.email,
            }).schedule();
        }
    }
}
