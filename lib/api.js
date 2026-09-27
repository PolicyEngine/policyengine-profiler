const LOCAL_PROFILE_ENDPOINT = "/api/local-profile";
const DEFAULT_MODAL_API_URL =
  "https://policyengine--policyengine-profiler-profile.modal.run";

export function resolveProfileEndpoint({
  apiUrl = process.env.NEXT_PUBLIC_API_URL,
  hostname,
} = {}) {
  if (apiUrl && apiUrl.trim().length > 0) {
    return apiUrl.trim();
  }

  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_PROFILE_ENDPOINT;
  }

  return DEFAULT_MODAL_API_URL;
}

export function getProfileEndpoint() {
  if (typeof window === "undefined") {
    return resolveProfileEndpoint();
  }

  return resolveProfileEndpoint({
    hostname: window.location.hostname,
  });
}

export async function profilePolicyEngine(payload) {
  const response = await fetch(getProfileEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || !result?.ok) {
    throw new Error(
      result?.error?.detail || result?.error?.message || "Profiling failed.",
    );
  }

  return result;
}
