
import { createApp } from "../server/app";

const app = createApp();

export default function handler(req: any, res: any) {
  const originalUrl = new URL(
    req.url || "/",
    "http://localhost"
  );

  const apiPath = originalUrl.searchParams.get("__path");

  if (apiPath) {
    originalUrl.searchParams.delete("__path");

    const query = originalUrl.searchParams.toString();

    req.url = `/api/${apiPath}${query ? `?${query}` : ""}`;
  }

  return app(req, res);
}
