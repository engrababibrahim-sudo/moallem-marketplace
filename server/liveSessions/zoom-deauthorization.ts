import crypto from "crypto";
import type { Express, Request, Response } from "express";

type ZoomDeauthorizationEvent = {
  event?: string;
  payload?: {
    client_id?: string;
    user_id?: string;
    account_id?: string;
    deauthorization_time?: string;
  };
};

function verifyZoomSignature(req: Request): boolean {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  const timestamp = req.headers["x-zm-request-timestamp"];
  const signature = req.headers["x-zm-signature"];

  if (
    !secret ||
    typeof timestamp !== "string" ||
    typeof signature !== "string"
  ) {
    return false;
  }

  const requestTime = Number(timestamp);

  if (!Number.isFinite(requestTime)) return false;

  // Reject requests older than 5 minutes.
  if (Math.abs(Date.now() / 1000 - requestTime) > 300) {
    return false;
  }

  const message = `v0:${timestamp}:${JSON.stringify(req.body)}`;

  const hash = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  const expected = `v0=${hash}`;

  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export function registerZoomDeauthorizationRoute(app: Express) {
  app.post(
    "/api/zoom/deauthorization",
    (req: Request, res: Response) => {
      if (!verifyZoomSignature(req)) {
        res.status(401).json({ error: "Invalid Zoom signature" });
        return;
      }

      const event = req.body as ZoomDeauthorizationEvent;

      if (event.event !== "app_deauthorized" || !event.payload) {
        res.status(400).json({ error: "Invalid deauthorization event" });
        return;
      }

      console.info("[Zoom] App deauthorized", {
        clientId: event.payload.client_id,
        userId: event.payload.user_id,
        accountId: event.payload.account_id,
        deauthorizationTime: event.payload.deauthorization_time,
      });

      res.status(200).json({ received: true });
    }
  );
}
