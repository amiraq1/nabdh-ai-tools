codex/investigate-github-actions-job-failure
import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const viteLogger = createLogger();
const moduleUrl = typeof import.meta !== "undefined" ? import.meta.url : undefined;
const currentDir =
  typeof __dirname !== "undefined"
    ? __dirname
    : moduleUrl
      ? path.dirname(fileURLToPath(moduleUrl))
      : process.cwd();
const clientTemplatePath = path.resolve(currentDir, "..", "client", "index.html");

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = clientTemplatePath;

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${randomUUID()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

diff --git a/server/vite.ts b/server/vite.ts
index 4a12bed5a69355dfae0d33abd3eda223dec2375a..22ab175398801edeefa7a51e882cf62363dfa504 100644
--- a/server/vite.ts
+++ b/server/vite.ts
@@ -1,62 +1,62 @@
 import { type Express } from "express";
 import { createServer as createViteServer, createLogger } from "vite";
 import { type Server } from "http";
 import viteConfig from "../vite.config";
 import fs from "fs";
 import path from "path";
 import { fileURLToPath } from "url";
-import { nanoid } from "nanoid";
+import { randomUUID } from "crypto";
 
 const viteLogger = createLogger();
 const moduleUrl = typeof import.meta !== "undefined" ? import.meta.url : undefined;
 const currentDir =
   typeof __dirname !== "undefined"
     ? __dirname
     : moduleUrl
       ? path.dirname(fileURLToPath(moduleUrl))
       : process.cwd();
 const clientTemplatePath = path.resolve(currentDir, "..", "client", "index.html");
 
 export async function setupVite(server: Server, app: Express) {
   const serverOptions = {
     middlewareMode: true,
     hmr: { server, path: "/vite-hmr" },
     allowedHosts: true as const,
   };
 
   const vite = await createViteServer({
     ...viteConfig,
     configFile: false,
     customLogger: {
       ...viteLogger,
       error: (msg, options) => {
         viteLogger.error(msg, options);
         process.exit(1);
       },
     },
     server: serverOptions,
     appType: "custom",
   });
 
   app.use(vite.middlewares);
 
   app.use("*", async (req, res, next) => {
     const url = req.originalUrl;
 
     try {
       const clientTemplate = clientTemplatePath;
 
       // always reload the index.html file from disk incase it changes
       let template = await fs.promises.readFile(clientTemplate, "utf-8");
       template = template.replace(
         `src="/src/main.tsx"`,
-        `src="/src/main.tsx?v=${nanoid()}"`,
+        `src="/src/main.tsx?v=${randomUUID()}"`,
       );
       const page = await vite.transformIndexHtml(url, template);
       res.status(200).set({ "Content-Type": "text/html" }).end(page);
     } catch (e) {
       vite.ssrFixStacktrace(e as Error);
       next(e);
     }
   });
 }main
