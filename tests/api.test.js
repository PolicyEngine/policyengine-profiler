import { describe, expect, it } from "vitest";

import { resolveProfileEndpoint } from "../lib/api";

describe("api endpoint resolution", () => {
  it("uses the configured public API URL when present", () => {
    expect(
      resolveProfileEndpoint({
        apiUrl: "https://policyengine--policyengine-profiler-profile.modal.run",
        hostname: "policyengine-profiler.vercel.app",
      }),
    ).toBe("https://policyengine--policyengine-profiler-profile.modal.run");
  });

  it("falls back to the local route on localhost", () => {
    expect(
      resolveProfileEndpoint({
        apiUrl: "",
        hostname: "localhost",
      }),
    ).toBe("/api/local-profile");
  });

  it("falls back to the deployed Modal endpoint in production", () => {
    expect(
      resolveProfileEndpoint({
        apiUrl: "",
        hostname: "policyengine-profiler.vercel.app",
      }),
    ).toBe("https://policyengine--policyengine-profiler-profile.modal.run");
  });
});
