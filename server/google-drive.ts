
import { google } from "googleapis";
import { Readable } from "node:stream";

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

export function getGoogleDriveAuthorizationUrl(state: string) {
  if (!state) {
    throw new Error("OAuth state is required.");
  }

  return getOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.file",
    ],
    state,
  });
}

export async function exchangeGoogleDriveCode(
  code: string
): Promise<string> {
  if (!code) {
    throw new Error("Google Drive authorization code is required.");
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

function getDriveClient(refreshToken: string) {
  if (!refreshToken) {
    throw new Error("Google Drive refresh token is required.");
  }

  const oauth2Client = getOAuthClient();

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.drive({
    version: "v3",
    auth: oauth2Client,
  });
}

export async function uploadGoogleDriveFile(
  refreshToken: string,
  filename: string,
  mimeType: string,
  buffer: Buffer
) {
  if (!buffer.length) {
    throw new Error("The uploaded file is empty.");
  }

  const drive = getDriveClient(refreshToken);

  const response = await drive.files.create({
    requestBody: {
      name: filename,
      mimeType,
    },
    media: {
      mimeType,
      body: Readable.from([buffer]),
    },
    fields: "id,name,mimeType,size,webViewLink",
  });

  if (!response.data.id) {
    throw new Error("Google Drive did not return a file ID.");
  }

  return response.data;
}

export async function deleteGoogleDriveFile(
  refreshToken: string,
  fileId: string
) {
  if (!fileId) {
    throw new Error("Google Drive file ID is required.");
  }

  const drive = getDriveClient(refreshToken);

  await drive.files.delete({
    fileId,
  });
}

export async function listGoogleDriveFiles(
  refreshToken: string
) {
  const drive = getDriveClient(refreshToken);

  const response = await drive.files.list({
    pageSize: 100,
    orderBy: "modifiedTime desc",
    fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
    q: "trashed = false",
  });

  return response.data.files ?? [];
}

export async function getGoogleDriveFileMetadata(
  refreshToken: string,
  fileId: string
) {
  if (!fileId) {
    throw new Error("Google Drive file ID is required.");
  }

  const drive = getDriveClient(refreshToken);

  const response = await drive.files.get({
    fileId,
    fields: "id,name,mimeType,size,webViewLink",
    supportsAllDrives: true,
  });

  return response.data;
}
