import { MarkdownTextSplitter } from 'langchain/text_splitter';
import { AzureOpenAI } from 'openai';
import Logger from '@server/logging/Logger';
import env from './env';

export interface CompletionRequestTokenUsage {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
}

export interface OpenAIChatMessage {
    content: string;
    tool_calls?: any[];
    role: ChatGPTRole;
}

export type ChatGPTRole = 'user' | 'system' | 'assistant';

export interface CompletionResponse {
    tokenUsage: CompletionRequestTokenUsage;
    text: string;
}

export interface OpenAICompletionPayload {
    prompt?: string | string[];
    messages: OpenAIChatMessage[];
    temperature: number;
    top_p?: number;
    frequency_penalty: number;
    presence_penalty: number;
    max_tokens: number;
    stream: boolean;
    stop?: string[];
    user?: string;
    tools?: any[];
    tool_choice?: any;
    n?: number;
}

interface OpenAICompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: OpenAICompletionChoice[];
    usage: OpenAICompletionUsage;
    error?: any;
}

interface OpenAIEmbeddingData {
    object: string;
    index: number;
    embedding: number[];
}

interface OpenAIEmbeddingsResponse {
    object: string;
    model: string;
    data: OpenAIEmbeddingData[];
    usage: OpenAICompletionUsage;
}

interface OpenAICompletionChoice {
    index: number;
    finish_reason: string;
    message: OpenAIChatMessage;
}

interface OpenAICompletionUsage {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
}

const completionsEndpoint =
    env.OPENAI_URL +
    '/openai/deployments/gpt-35-turbo/chat/completions?api-version=2024-04-01-preview';
const embeddingsEndpoint =
    env.OPENAI_URL +
    '/openai/deployments/doc-embedding/embeddings?api-version=2023-03-15-preview';

export class MoteAI {
    /**
     * Returns whether OpenAI is enabled.
     *
     * @returns boolean
     */
    static get isEnabled() {
        return !!env.OPENAI_API_KEY;
    }

    static get models() {
        return {
            'text-embedding-ada-002': {
                maxTokens: 8191,
                dimensions: 1536,
            },
            'gpt-3.5-turbo-1106': {
                maxTokens: 4096,
            },
        };
    }

    private static _client: AzureOpenAI | null = null;
    static get client(): AzureOpenAI {
        if (!this._client) {
            const deployment = 'gpt-35-turbo';
            const apiVersion = '2024-04-01-preview';
            this._client = new AzureOpenAI({
                endpoint: env.OPENAI_URL,
                apiKey: env.OPENAI_API_KEY,
                apiVersion,
                deployment,
            });
        }
        return this._client;
    }

    static async getCompletion(
        prompt: string,
        options?: Partial<OpenAICompletionPayload>
    ) {
        const tokenUsage = {
            completionTokens: 0,
            promptTokens: 0,
            totalTokens: 0,
        };

        const requestHeaders: Record<string, any> = {
            'Content-Type': 'application/json',
            'api-key': env.OPENAI_API_KEY,
        };

        const payload: OpenAICompletionPayload = {
            messages: options?.messages || [{ content: prompt, role: 'user' }],
            temperature: options?.temperature || 0.0,
            max_tokens: options?.max_tokens || 100,
            stream: false,
            frequency_penalty: 0,
            presence_penalty: 0,
            tools: options?.tools,
            // tool_choice: options?.tool_choice,
            stop: options?.stop || ['\n'],
        };

        const data: OpenAICompletionResponse = (await fetch(
            completionsEndpoint,
            {
                headers: requestHeaders,
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ).then((res) => res.json())) as OpenAICompletionResponse;

        const {
            completion_tokens: completionTokens,
            prompt_tokens: promptTokens,
            total_tokens: totalTokens,
        } = data.usage ?? {};

        if (completionTokens) {
            tokenUsage.completionTokens =
                (tokenUsage.completionTokens ?? 0) + completionTokens;
        }
        if (promptTokens) {
            tokenUsage.promptTokens =
                (tokenUsage.promptTokens ?? 0) + promptTokens;
        }
        if (totalTokens) {
            tokenUsage.totalTokens =
                (tokenUsage.totalTokens ?? 0) + totalTokens;
        }

        if (data.error) {
            Logger.info(
                'plugins',
                'OpenAI completion error with payload',
                payload
            );
            Logger.debug('plugins', 'OpenAI completion response', data);

            return {};
        }

        Logger.debug('plugins', 'OpenAI completion payload', payload);
        Logger.debug('plugins', 'OpenAI completion response', data);

        return {
            totalTokens,
            text: data.choices[0].message.content,
            toolCalls: data.choices[0].message.tool_calls,
        };
    }

    /**
     * Get the vector embedding for a given input string.
     *
     * @param input - The input string to get the embedding for.
     * @returns The embedding as a vector.
     */
    static async getEmbedding(input: string) {
        // Strip newlines as recommended by OpenAI
        input = input.replace(/\\n/g, ' ');

        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'api-key': env.OPENAI_API_KEY!,
        };

        const payload = {
            input,
        };

        const response: OpenAIEmbeddingsResponse = await fetch(
            embeddingsEndpoint,
            {
                headers: requestHeaders,
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ).then((res) => res.json());

        return {
            embedding: response.data[0].embedding,
            model: response.model,
            totalTokens: response.usage.total_tokens,
        };
    }

    static splitText(text: string, maxTokens?: number) {
        maxTokens =
            maxTokens ?? MoteAI.models['text-embedding-ada-002'].maxTokens;
        const splitter = new MarkdownTextSplitter({
            chunkSize: maxTokens,
            chunkOverlap: 0,
            keepSeparator: true,
        });
        return splitter.splitText(text);
    }
}
