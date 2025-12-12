diff --git a/server/types/pg.d.ts b/server/types/pg.d.ts
new file mode 100644
index 0000000000000000000000000000000000000000..83c5abf6b16b10dff7240497db8077ff02aa4f8b
--- /dev/null
+++ b/server/types/pg.d.ts
@@ -0,0 +1,20 @@
+declare module "pg" {
+  export interface PoolConfig {
+    connectionString?: string;
+    ssl?: unknown;
+    max?: number;
+    idleTimeoutMillis?: number;
+    connectionTimeoutMillis?: number;
+  }
+
+  export class Pool {
+    constructor(config?: PoolConfig);
+    connect(): Promise<PoolClient>;
+    end(): Promise<void>;
+    query: (...args: unknown[]) => Promise<unknown>;
+  }
+
+  export interface PoolClient {
+    release?: () => void;
+  }
+}
