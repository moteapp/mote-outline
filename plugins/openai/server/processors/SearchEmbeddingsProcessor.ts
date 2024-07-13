import { TeamPreference } from '@shared/types';
import { Team, Document } from '@server/models';
import BaseProcessor from '@server/queues/processors/BaseProcessor';
import {
    DocumentEvent,
    RevisionEvent,
    Event,
    CollectionEvent,
} from '@server/types';
import { SearchIndex } from '../searchIndex';

export class SearchEmbeddingsProcessor extends BaseProcessor {
    static applicableEvents: Event['name'][] = [
        'documents.publish',
        'documents.restore',
        'documents.move',
        'documents.title_change',
        'documents.delete',
        'documents.unpublish',
        'revisions.create',
        'collections.delete',
    ];

    async perform(event: Event) {
        switch (event.name) {
            case 'documents.publish':
            case 'documents.update':
            case 'revisions.create':
            case 'documents.move':
            case 'documents.restore':
            case 'documents.title_change':
                if (await this.isEnabled(event)) {
                    return this.documentUpdated(event);
                }
                break;
            case 'documents.delete':
            case 'documents.unpublish':
                if (await this.isEnabled(event)) {
                    return this.documentDeleted(event);
                }
                break;
            case 'collections.delete':
                if (await this.isEnabled(event)) {
                    return this.collectionDeleted(event);
                }
                break;
            default:
        }
    }

    async documentUpdated(event: DocumentEvent | RevisionEvent) {
        const document = await Document.findByPk(event.documentId);
        if (document) {
            await this.indexDocument(document);
        }
    }

    async documentDeleted(event: DocumentEvent | RevisionEvent) {
        await SearchIndex.deleteDocument(event.documentId);
    }

    async collectionDeleted(event: CollectionEvent) {
        const documents = await Document.findAll({
            attributes: ['id'],
            where: {
                collectionId: event.collectionId,
            },
        });
        for (const document of documents) {
            await SearchIndex.deleteDocument(document.id);
        }
    }

    async indexDocument(document: Document) {
        await SearchIndex.indexDocument(document);
    }

    async isEnabled(event: Event) {
        const team = await Team.findByPk(event.teamId);
        if (!team || !team.getPreference(TeamPreference.AIAnswers)) {
            return false;
        }
        return true;
    }
}
