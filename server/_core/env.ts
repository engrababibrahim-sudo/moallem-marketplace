export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  // Standalone deployments may not inject the WebDev system variable. Keep
  // the override for managed/custom environments, but use Manus's public
  // OAuth API as the safe default so code exchange can reach the auth server.
  oAuthServerUrl: process.env.OAUTH_SERVER_URL || "https://api.manus.im",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
