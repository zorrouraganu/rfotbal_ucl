import { afterEach, describe, expect, it } from "vitest";
import { buildAppUrl } from "./appUrl";

const originalAppBaseUrl = process.env.APP_BASE_URL;

afterEach(() => {
  if (originalAppBaseUrl === undefined) delete process.env.APP_BASE_URL;
  else process.env.APP_BASE_URL = originalAppBaseUrl;
});

describe("buildAppUrl", () => {
  it("uses the configured public origin instead of an internal request URL", () => {
    process.env.APP_BASE_URL = "https://ucl.rfotbal.ro";
    expect(buildAppUrl("/account", "http://localhost:3000/api/auth/reddit/callback").href)
      .toBe("https://ucl.rfotbal.ro/account");
  });

  it("uses the request origin when no application base URL is configured", () => {
    delete process.env.APP_BASE_URL;
    expect(buildAppUrl("/login", "http://localhost:3000/api/auth/logout").href)
      .toBe("http://localhost:3000/login");
  });
});
