const KEYS = ["incomePoints", "variable", "country"];

export function parseHash(hash) {
  const normalized = hash?.startsWith("#") ? hash.slice(1) : hash || "";
  const params = new URLSearchParams(normalized);

  return KEYS.reduce((accumulator, key) => {
    const value = params.get(key);
    if (value) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

export function buildHash({ country, incomePoints, variable, isEmbedded }) {
  const params = new URLSearchParams();

  if (incomePoints) {
    params.set("incomePoints", String(incomePoints));
  }

  if (variable) {
    params.set("variable", variable);
  }

  if (!isEmbedded && country && country !== "us") {
    params.set("country", country);
  }

  const serialized = params.toString();
  return serialized ? `#${serialized}` : "#";
}
