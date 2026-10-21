
import { google } from "googleapis";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;

function getOAuthClient() {
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Google OAuth environment variables are missing"
    );
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

/**
 * Creates the URL used to authorize access to Google Drive.
 * Keep the resulting authorization flow restricted to an administrator.
 */
export function getGoogleAuthorizationUrl() {
  const oauth2Client = getOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/drive.readonly",
    ],
  });
}

/**
 * Exchanges Google's authorization code for tokens.
 * Tokens must be stored securely on the server, never in frontend code.
 */
export async function exchangeGoogleAuthorizationCode(
  code: string
) {
  if (!code.trim()) {
    throw new Error("Google authorization code is missing");
  }

  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  return tokens;
}

/**
 * Creates an authenticated Drive client.
 * Pass tokens retrieved from secure server-side storage.
 */
export function createGoogleDriveClient(
  tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    scope?: string | null;
    token_type?: string | null;
    expiry_date?: number | null;
    id_token?: string | null;
  }
) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(tokens);

  return google.drive({
    version: "v3",
    auth: oauth2Client,
  });
}
