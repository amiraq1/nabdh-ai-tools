// server/types.d.ts
export {};

declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
    ssl?: unknown;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
    query: (...args: unknown[]) => Promise<unknown>;
  }

  export interface PoolClient {
    release?: () => void;
  }
}
