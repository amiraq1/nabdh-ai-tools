declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
    ssl?: unknown;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export interface QueryConfig {
    text: string;
    values?: unknown[];
  }

  export interface QueryResult<T = any> {
    rows: T[];
    rowCount?: number;
  }

  export interface PoolClient {
    query<T = any>(queryText: string | QueryConfig, values?: unknown[]): Promise<QueryResult<T>>;
    release(): void;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
    query: PoolClient["query"];
  }
}
