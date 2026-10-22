
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

/**
 * إنشاء جلسة رفع مباشر إلى Google Drive.
 * الفيديو لا يمر عبر خادم Vercel.
 */
export async function createGoogleDriveUploadSession(
  refreshToken: string,
  filename: string,
  mimeType: string,
  size: number,
  teacherId: string
): Promise<string> {
  if (
    !refreshToken ||
    !filename ||
    !teacherId ||
    !Number.isSafeInteger(size) ||
    size <= 0 ||
    size > 100 * 1024 * 1024 ||
    !["video/mp4", "video/webm"].includes(mimeType)
  ) {
    throw new Error("Invalid Google Drive upload parameters.");
  }

  const oauth = getOAuthClient();
  oauth.setCredentials({
    refresh_token: refreshToken,
  });

  const { token } = await oauth.getAccessToken();

  if (!token) {
    throw new Error(
      "Unable to obtain a Google access token."
    );
  }

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(size),
      },
      body: JSON.stringify({
        name: filename,
        mimeType,
        appProperties: {
          moallemTeacherId: teacherId,
          moallemDocumentType: "teaching_video",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Google Drive upload session failed: ${response.status}`
    );
  }

  const uploadUrl = response.headers.get("Location");

  if (!uploadUrl) {
    throw new Error(
      "Google Drive did not return an upload URL."
    );
  }

  return uploadUrl;
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
    throw new Error(
      "Google Drive did not return a file ID."
    );
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
    fields:
      "files(id,name,mimeType,modifiedTime,webViewLink)",
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
    fields:
      "id,name,mimeType,size,webViewLink,appProperties,trashed",
    supportsAllDrives: true,
  });

  return response.data;
}
