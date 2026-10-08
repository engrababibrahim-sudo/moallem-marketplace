import type { Express, Request, Response } from "express";

export type MeetingProvider = "zoom" | "google_meet";

export type CreateMeetingInput = {
  provider: MeetingProvider;
  topic: string;
  startAt: string;
  endAt: string;
  timezone: string;
};

export type CreatedMeeting = {
  provider: MeetingProvider;
  providerMeetingId: string;
  joinUrl: string;
  hostUrl: string;
};

export interface MeetingProviderAdapter {
  readonly provider: MeetingProvider;
  isConfigured(): boolean;
  createMeeting(input: CreateMeetingInput): Promise<CreatedMeeting>;
  cancelMeeting(providerMeetingId: string): Promise<void>;
}

/**
 * Provider-neutral meeting layer.
 *
 * Zoom and Google Meet are deliberately kept behind the same interface.
 * This lets bookings/live_sessions remain stable if the platform later
 * adds another provider.
 *
 * Credentials are intentionally NOT read from client code.
 * They will be supplied as server-side environment variables owned by
 * the platform owner.
 */

function missingProviderConfig(provider: MeetingProvider): never {
  throw new Error(
    provider === "zoom"
      ? "Zoom is not configured yet. Add the platform owner's Zoom credentials."
      : "Google Meet is not configured yet. Add the platform owner's Google credentials."
  );
}

const zoomAdapter: MeetingProviderAdapter = {
  provider: "zoom",

  isConfigured() {
    return Boolean(
      process.env.ZOOM_CLIENT_ID &&
        process.env.ZOOM_CLIENT_SECRET &&
        process.env.ZOOM_ACCOUNT_ID
    );
  },

  async createMeeting() {
    if (!this.isConfigured()) missingProviderConfig("zoom");

    // OAuth + Zoom Meetings API will be wired here in the next integration step.
    throw new Error("Zoom adapter is ready but API creation is not enabled yet.");
  },

  async cancelMeeting() {
    if (!this.isConfigured()) missingProviderConfig("zoom");

    // Zoom DELETE /users/{userId}/meetings/{meetingId} will be wired here.
    throw new Error("Zoom adapter is ready but API cancellation is not enabled yet.");
  },
};

const googleMeetAdapter: MeetingProviderAdapter = {
  provider: "google_meet",

  isConfigured() {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REFRESH_TOKEN
    );
  },

  async createMeeting() {
    if (!this.isConfigured()) missingProviderConfig("google_meet");

    // Google Calendar API will create the event + Google Meet conference here.
    throw new Error(
      "Google Meet adapter is ready but API creation is not enabled yet."
    );
  },

  async cancelMeeting() {
    if (!this.isConfigured()) missingProviderConfig("google_meet");

    // Google Calendar API event deletion will be wired here.
    throw new Error(
      "Google Meet adapter is ready but API cancellation is not enabled yet."
    );
  },
};

export function getMeetingProvider(
  provider: MeetingProvider
): MeetingProviderAdapter {
  if (provider === "zoom") return zoomAdapter;
  if (provider === "google_meet") return googleMeetAdapter;

  throw new Error("Unsupported meeting provider.");
}

export function registerLiveSessionRoutes(app: Express) {
  app.get("/api/live-sessions/providers", (_req: Request, res: Response) => {
    res.json({
      providers: [
        {
          id: "zoom",
          configured: zoomAdapter.isConfigured(),
          label: "Zoom",
        },
        {
          id: "google_meet",
          configured: googleMeetAdapter.isConfigured(),
          label: "Google Meet",
        },
      ],
    });
  });
}
