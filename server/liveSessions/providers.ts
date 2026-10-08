import type { Express, Request, Response } from "express";
import { zoomAdapter } from "./zoom";

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
    throw new Error("Google Meet adapter is not enabled yet.");
  },

  async cancelMeeting() {
    throw new Error("Google Meet adapter is not enabled yet.");
  },
};

export function getMeetingProvider(provider: MeetingProvider): MeetingProviderAdapter {
  if (provider === "zoom") return zoomAdapter;
  if (provider === "google_meet") return googleMeetAdapter;
  throw new Error("Unsupported meeting provider.");
}

export function registerLiveSessionRoutes(app: Express) {
  app.get("/api/live-sessions/providers", (_req: Request, res: Response) => {
    res.json({
      providers: [
        { id: "zoom", configured: zoomAdapter.isConfigured(), label: "Zoom" },
        { id: "google_meet", configured: googleMeetAdapter.isConfigured(), label: "Google Meet" },
      ],
    });
  });
}
