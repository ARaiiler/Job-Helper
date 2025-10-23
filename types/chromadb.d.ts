declare module 'chromadb' {
    export type Where = Record<string, any>;
    export type WhereDocument = Record<string, any>;

    export interface DeleteOptions {
        ids?: string[];
        where?: Where;
        whereDocument?: WhereDocument;
    }
    export type SparseVector = number[];

    export type Metadata = {
        [key: string]: string | number | boolean | SparseVector | null;
    };

    export interface ChromaApiOptions {
        host?: string;
        port?: number;
        ssl?: boolean;
    }

    export interface EmbeddingFunctionOptions {
        openai_api_key: string;
        openai_model: string;
    }

    export interface CollectionOptions {
        name: string;
        embeddingFunction: OpenAIEmbeddingFunction;
        metadata?: Metadata;
    }

    export interface AddOptions {
        ids: string[];
        documents: string[];
        metadatas?: Metadata[];
    }

    export interface QueryOptions {
        queryTexts: string[];
        nResults?: number;
        where?: Metadata;
    }

    export interface QueryResult {
        ids: string[][];
        documents: string[][];
        metadatas: Metadata[][];
        distances?: number[][];
    }

    export class ChromaApi {
        constructor(options?: ChromaApiOptions);
        getOrCreateCollection(options: CollectionOptions): Promise<Collection>;
    }

    export class Collection {
        add(options: AddOptions): Promise<void>;
        query(options: QueryOptions): Promise<QueryResult>;
        delete(options?: DeleteOptions): Promise<void>;
    }

    export class OpenAIEmbeddingFunction {
        constructor(options: EmbeddingFunctionOptions);
    }
}