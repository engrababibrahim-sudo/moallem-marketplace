import express from "express";
import { registerLiveSessionManagementRoutes } from "../../server/liveSessions/routes.ts";

const app = express();

app.use(express.json({ limit: "1mb" }));
registerLiveSessionManagementRoutes(app);

export default function handler(req: any, res: any) {
  return app(req, res);
}
