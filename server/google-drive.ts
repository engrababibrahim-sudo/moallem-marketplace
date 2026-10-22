
import { google } from "googleapis";

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Google OAuth configuration. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI."
    );
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

/**
 * Creates the Google authorization URL.
 * Use only from a protected administrator endpoint.
 */
export function getGoogleDriveAuthorizationUrl(state: string) {
  if (!state) {
    throw new Error("OAuth state is required.");
  }

  const oauth2Client = getOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/drive.readonly",
    ],
    state,
  });
}

/**
 * Exchanges Google's callback code for a refresh token.
 * The token must only be stored securely on the server.
 */
export async function exchangeGoogleDriveCode(
  code: string
): Promise<string> {
  if (!code) {
    throw new Error("Google OAuth authorization code is required.");
  }

  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. Reauthorize with consent."
    );
  }

  return tokens.refresh_token;
}

/**
 * Lists files from Google Drive using a server-side refresh token.
 */
export async function listGoogleDriveFiles(
  refreshToken: string
) {
  if (!refreshToken) {
    throw new Error("Google Drive refresh token is required.");
  }

  const oauth2Client = getOAuthClient();

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const drive = google.drive({
    version: "v3",
    auth: oauth2Client,
  });

  const response = await drive.files.list({
    pageSize: 100,
    orderBy: "modifiedTime desc",
    fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
    q: "trashed = false",
  });

  return response.data.files ?? [];
}

/**
 * Retrieves metadata for a Google Drive file.
 * Check student authorization before returning file information.
 */
export async function getGoogleDriveFileMetadata(
  refreshToken: string,
  fileId: string
) {
  if (!refreshToken || !fileId) {
    throw new Error(
      "Refresh token and file ID are required."
    );
  }

  const oauth2Client = getOAuthClient();

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const drive = google.drive({
    version: "v3",
    auth: oauth2Client,
  });

  const response = await drive.files.get({
    fileId,
    fields: "id,name,mimeType,size,webViewLink",
    supportsAllDrives: true,
  });

  return response.data;
}
