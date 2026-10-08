import "dotenv/config";
import express from "express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerPaymobRoutes } from "./payments/paymob";
import { registerLiveSessionRoutes } from "./liveSessions/providers";
import { registerLiveSessionManagementRoutes } from "./liveSessions/routes";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerPaymobRoutes(app);
  registerLiveSessionRoutes(app);
  registerLiveSessionManagementRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
