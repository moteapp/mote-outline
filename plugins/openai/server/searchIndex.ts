import { languageOptions } from '@shared/i18n';
import Logger from '@server/logging/Logger';
import { Document, User } from '@server/models';
import { DocumentHelper } from '@server/models/helpers/DocumentHelper';
import { DocumentVector } from './models/DocumentVector';
import { MoteAI } from './openai';
import * as vector from './storage/vector';
import { ChatCompletionMessageParam } from 'openai/resources';

export class SearchIndex {
    static initialized: boolean = false;

    static async init() {
        if (this.initialized) {
            return;
        }
        if (!vector.sequelize || !vector.migrations) {
            return;
        }
        await vector.migrations.up();
        this.initialized = true;
    }

    static async getSimilarDocuments(
        user: User,
        documentId: string,
        limit: number = 2
    ) {
        const embedding = await DocumentVector.getEmbeddingById(documentId);
        if (!embedding) {
            return [];
        }
        const results = await DocumentVector.search(user, embedding, {
            limit,
        });

        // TODO: relevance cutoff

        return results.slice(1).map((result) => result.id);
    }

    static async searchDocuments(user: User, query: string, options: any) {
        const { embedding } = await MoteAI.getEmbedding(query);
        try {
            return await DocumentVector.search(user, embedding, options);
        } catch (error) {
            if (error.message.includes('$libdir/vector')) {
                throw new Error(
                    'DATABASE_URL_VECTOR is set but the database does not appear to have the `pgvector` extension installed.'
                );
            }
            throw error;
        }
    }

    static async suggestAnswer(user: User, query: string, options: any) {
        let _languageOptions$find, _languageOptions$find2;
        const documentVectors = await SearchIndex.searchDocuments(
            user,
            query,
            options
        );
        const documents = await Document.findAll({
            where: {
                teamId: user.teamId,
                id: documentVectors.map((v) => v.documentId),
            },
        });
        const language =
            user.language === 'en_US'
                ? undefined
                : (_languageOptions$find =
                      (_languageOptions$find2 = languageOptions.find(
                          (l) => l.value === user.language
                      )) === null || _languageOptions$find2 === void 0
                          ? void 0
                          : _languageOptions$find2.label) !== null &&
                  _languageOptions$find !== void 0
                ? _languageOptions$find
                : undefined;
        const messages = [
            this.buildRulesPrompt(language!),
            {
                content: '<DOCUMENTS>',
                role: 'assistant',
            },
            ...documentVectors.map((documentVector) => {
                const document = documents.find(
                    (document) => document.id === documentVector.documentId
                );
                if (!document) {
                    return {
                        content: '',
                        role: 'assistant',
                    };
                }
                const content = DocumentHelper.toMarkdown(document);
                const slice = content.slice(
                    documentVector.offset,
                    documentVector.offset +
                        (documentVector.length
                            ? documentVector.length
                            : content.length)
                );
                return {
                    content: '<DOCUMENT id="'
                        .concat(document.id, '">')
                        .concat(slice, '</DOCUMENT>'),
                    role: 'assistant',
                };
            }),
            {
                content: '</DOCUMENTS>',
                role: 'assistant',
            },
            ...(language ? [this.buildLanguagePrompt(language)] : []),
            {
                content:
                    'Using only information contained between the <DOCUMENTS></DOCUMENTS> tags what is the best answer to the following question (If the answer to the question is not in the provided documents answer with ❌):',
                role: 'assistant',
            },
            {
                content: query.trim(),
                role: 'user',
            },
        ];
        const response = await MoteAI.client.chat.completions.create({
            model: '',
            temperature: 0,
            tools: [
                {
                    type: 'function',
                    function: {
                        name: 'answer_question',
                        parameters: {
                            type: 'object',
                            properties: {
                                answer: {
                                    type: 'string',
                                    description: 'The answer to the question',
                                },
                                references: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        description:
                                            "A list of Document ID's where content from the associated context was used in the generated answer",
                                    },
                                },
                            },
                            required: ['answer', 'references'],
                        },
                    },
                },
            ],
            tool_choice: {
                type: 'function',
                function: {
                    name: 'answer_question',
                },
            },
            messages: messages as any,
        });
        Logger.debug('plugins', 'MoteAI response', response);
        const toolCalls = response.choices[0].message.tool_calls;
        if (toolCalls) {
            let _args$references;
            const args = JSON.parse(toolCalls[0].function.arguments);
            const answer = args.answer.trim();
            if (
                !answer ||
                answer.includes('❌') ||
                !(
                    (_args$references = args.references) !== null &&
                    _args$references !== void 0 &&
                    _args$references.length
                )
            ) {
                return {
                    answer: '',
                    documents: [],
                };
            }
            return {
                answer,
                documents: documents.filter((doc) =>
                    args.references.includes(doc.id)
                ),
            };
        }
        return {
            answer: '',
            documents: [],
        };
    }

    static async indexDocument(document: Document) {
        const markdown = DocumentHelper.toMarkdown(document);
        const contents = await MoteAI.splitText(markdown);

        let offset = 0;
        await DocumentVector.destroy({
            where: {
                documentId: document.id,
            },
        });

        for (const content of contents) {
            const { embedding } = await MoteAI.getEmbedding(content);
            Logger.info('plugins', 'Indexing document vector', {
                documentId: document.id,
                offset,
            });
            await DocumentVector.create({
                teamId: document.teamId,
                documentId: document.id,
                collectionId: document.collectionId,
                embedding,
                length: content.length,
                offset,
            });

            // +1 for the split newline character
            offset += content.length;
        }
    }

    static async deleteDocument(documentId: string) {
        await DocumentVector.destroy({
            where: {
                documentId,
            },
        });
    }

    static buildRulesPrompt(language?: string) {
        return {
            content:
                '\nYou are a helpful assistant to answer questions where possible based on the information in provided documents.\n\nRULES:\n- The current date is '
                    .concat(
                        new Date().toLocaleDateString('en-US'),
                        '.\n- You can use simple Markdown formatting to make your answer more readable: links, italic, and lists.\n- NEVER say you are an AI language model.\n- NEVER return more than two paragraphs of text.\n- NEVER include or refer to Document IDs in the answer.\n- NEVER include information from outside the <DOCUMENTS></DOCUMENTS> tags in your answer.\n- Keep answers concise.\n- '
                    )
                    .concat(
                        language === 'de_DE'
                            ? 'Use the familar informal phrasing in your response.'
                            : 'Use the tone and formality of the documents where possible.',
                        '\n- Do not refer to yourself or I, instead use "the workspace".'
                    ),
            role: 'assistant',
        };
    }

    static buildLanguagePrompt(language: string) {
        let _exec;
        const languageInEnglish =
            (_exec = /\((.*?)\)/.exec(language)) === null || _exec === void 0
                ? void 0
                : _exec[1];
        return {
            content: 'Please respond in '.concat(languageInEnglish!),
            role: 'user',
        };
    }
}
