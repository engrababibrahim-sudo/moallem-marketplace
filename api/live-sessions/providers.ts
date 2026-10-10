export default function handler(_req: any, res: any) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).json({
    providers: [
      {
        id: "zoom",
        configured: Boolean(
          process.env.ZOOM_ACCOUNT_ID &&
            process.env.ZOOM_CLIENT_ID &&
            process.env.ZOOM_CLIENT_SECRET
        ),
        label: "Zoom",
      },
      {
        id: "google_meet",
        configured: Boolean(
          process.env.GOOGLE_CLIENT_ID &&
            process.env.GOOGLE_CLIENT_SECRET &&
            process.env.GOOGLE_REFRESH_TOKEN
        ),
        label: "Google Meet",
      },
    ],
  });
}
