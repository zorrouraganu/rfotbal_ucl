export function buildAppUrl(path: string, requestUrl: string) {
  const configuredBaseUrl = process.env.APP_BASE_URL?.trim();
  return new URL(path, configuredBaseUrl || requestUrl);
}
