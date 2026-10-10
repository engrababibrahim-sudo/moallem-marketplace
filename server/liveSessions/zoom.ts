import type {
  CreateMeetingInput,
  CreatedMeeting,
  MeetingProviderAdapter,
} from "./providers.ts";

type ZoomTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

type ZoomMeetingResponse = {
  id?: number;
  join_url?: string;
  start_url?: string;
};

async function getZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom credentials are not configured.");
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const data = (await response.json().catch(() => null)) as ZoomTokenResponse | null;

  if (!response.ok || !data?.access_token) {
    console.error("Zoom OAuth error", response.status, data);
    throw new Error("Unable to authenticate with Zoom.");
  }

  return data.access_token;
}

export const zoomAdapter: MeetingProviderAdapter = {
  provider: "zoom",

  isConfigured() {
    return Boolean(
      process.env.ZOOM_ACCOUNT_ID &&
        process.env.ZOOM_CLIENT_ID &&
        process.env.ZOOM_CLIENT_SECRET
    );
  },

  async createMeeting(input: CreateMeetingInput): Promise<CreatedMeeting> {
    const accessToken = await getZoomAccessToken();

    const startTime = new Date(input.startAt);
    const endTime = new Date(input.endAt);
    const durationMinutes = Math.max(
      1,
      Math.round((endTime.getTime() - startTime.getTime()) / 60000)
    );

    const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: input.topic.slice(0, 200),
        type: 2,
        start_time: startTime.toISOString(),
        duration: durationMinutes,
        timezone: input.timezone,
        settings: {
          waiting_room: true,
          join_before_host: false,
          meeting_authentication: false,
          participant_video: true,
          host_video: true,
          mute_upon_entry: true,
        },
      }),
    });

    const data = (await response.json().catch(() => null)) as ZoomMeetingResponse | null;

    if (!response.ok || !data?.id || !data.join_url || !data.start_url) {
      console.error("Zoom create meeting error", response.status, data);
      throw new Error("Unable to create the Zoom meeting.");
    }

    return {
      provider: "zoom",
      providerMeetingId: String(data.id),
      joinUrl: data.join_url,
      hostUrl: data.start_url,
    };
  },

  async cancelMeeting(providerMeetingId: string): Promise<void> {
    const accessToken = await getZoomAccessToken();

    const response = await fetch(
      `https://api.zoom.us/v2/meetings/${encodeURIComponent(providerMeetingId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const body = await response.text().catch(() => "");
      console.error("Zoom cancel meeting error", response.status, body);
      throw new Error("Unable to cancel the Zoom meeting.");
    }
  },
};
