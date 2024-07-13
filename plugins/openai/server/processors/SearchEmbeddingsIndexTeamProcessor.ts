import { TeamPreference } from '@shared/types';
import BaseProcessor from '@server/queues/processors/BaseProcessor';
import { Event, TeamEvent } from '@server/types';
import { SearchEmbeddingsIndexTask } from '../tasks/SearchEmbeddingsIndexTask';

export class SearchEmbeddingsIndexTeamProcessor extends BaseProcessor {
    static applicableEvents: Event['name'][] = ['teams.update'];

    async perform(event: TeamEvent) {
        // Trigger embeddings backfill if the team enables answers.
        if (event.changes && event.changes.attributes.preferences) {
            const preferences = event.changes.attributes.preferences;
            const previousPreferences = event.changes.previous.preferences;
            // Enable answers this time and not previously
            if (
                preferences[TeamPreference.AIAnswers] &&
                !(
                    previousPreferences &&
                    previousPreferences[TeamPreference.AIAnswers]
                )
            ) {
                await SearchEmbeddingsIndexTask.schedule(event);
            }
        }
    }
}
