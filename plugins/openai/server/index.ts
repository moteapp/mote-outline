import { PluginManager, Hook } from '@server/utils/PluginManager';
import routes from './api/routes';
import { SearchEmbeddingsCompleteEmail } from './email/template/SearchEmbeddingsCompleteEmail';
import env from './env';
import { DocumentSummaryProcessor } from './processors/DocumentSummaryProcessor';
import { SearchEmbeddingsIndexTeamProcessor } from './processors/SearchEmbeddingsIndexTeamProcessor';
import { SearchEmbeddingsProcessor } from './processors/SearchEmbeddingsProcessor';
import { SearchEmbeddingsIndexTask } from './tasks/SearchEmbeddingsIndexTask';

const enabled = !!env.OPENAI_API_KEY;

if (enabled) {
    PluginManager.add([
        {
            type: Hook.API,
            value: routes,
        },
        {
            type: Hook.Processor,
            value: DocumentSummaryProcessor,
        },
        {
            type: Hook.Processor,
            value: SearchEmbeddingsProcessor,
        },
        {
            type: Hook.Processor,
            value: SearchEmbeddingsIndexTeamProcessor,
        },
        {
            type: Hook.EmailTemplate,
            value: SearchEmbeddingsCompleteEmail as any,
        },
        {
            type: Hook.Task,
            value: SearchEmbeddingsIndexTask,
        },
    ]);
}
