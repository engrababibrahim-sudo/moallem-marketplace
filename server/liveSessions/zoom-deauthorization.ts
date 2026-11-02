
import crypto from "crypto";
import type { Express, Request, Response } from "express";

type ZoomEvent = {
  event?: string;
  payload?: {
    plainToken?: string;
    client_id?: string;
    user_id?: string;
    account_id?: string;
    deauthorization_time?: string;
  };
};

function safeCompare(a: string, b: string): boolean {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  return (
    first.length === second.length &&
    crypto.timingSafeEqual(first, second)
  );
}

function verifyZoomSignature(
  req: Request,
  secret: string
): boolean {
  const timestamp = req.headers["x-zm-request-timestamp"];
  const signature = req.headers["x-zm-signature"];

  if (
    typeof timestamp !== "string" ||
    typeof signature !== "string"
  ) {
    return false;
  }

  const requestTime = Number(timestamp);

  if (!Number.isFinite(requestTime)) return false;

  if (Math.abs(Date.now() / 1000 - requestTime) > 300) {
    return false;
  }

  const message = `v0:${timestamp}:${JSON.stringify(req.body)}`;

  const hash = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  return safeCompare(signature, `v0=${hash}`);
}

export function registerZoomDeauthorizationRoute(app: Express) {
  app.post(
    "/api/zoom/deauthorization",
    (req: Request, res: Response) => {
      const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

      if (!secret) {
        console.error("[Zoom] Webhook secret is missing.");
        res.status(500).json({
          error: "Zoom webhook is not configured",
        });
        return;
      }

      const event = req.body as ZoomEvent;

      // Zoom endpoint URL validation
      if (event.event === "endpoint.url_validation") {
        const plainToken = event.payload?.plainToken;

        if (!plainToken) {
          res.status(400).json({
            error: "plainToken is missing",
          });
          return;
        }

        const encryptedToken = crypto
          .createHmac("sha256", secret)
          .update(plainToken)
          .digest("hex");

        res.status(200).json({
          plainToken,
          encryptedToken,
        });

        return;
      }

      // Verify all other Zoom notifications
      if (!verifyZoomSignature(req, secret)) {
        res.status(401).json({
          error: "Invalid Zoom signature",
        });
        return;
      }

      if (
        event.event !== "app_deauthorized" ||
        !event.payload
      ) {
        res.status(400).json({
          error: "Unsupported Zoom event",
        });
        return;
      }

      console.info("[Zoom] App deauthorized", {
        clientId: event.payload.client_id,
        userId: event.payload.user_id,
        accountId: event.payload.account_id,
        deauthorizationTime:
          event.payload.deauthorization_time,
      });

      res.status(200).json({
        received: true,
      });
    }
  );
}
