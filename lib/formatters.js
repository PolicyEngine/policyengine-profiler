const currencyCache = new Map();

function getCurrencyFormatter(currency) {
  if (!currencyCache.has(currency)) {
    currencyCache.set(
      currency,
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }),
    );
  }

  return currencyCache.get(currency);
}

export function formatDuration(seconds) {
  if (seconds == null || Number.isNaN(seconds)) {
    return "—";
  }

  if (seconds < 1) {
    return `${Math.round(seconds * 1000)} ms`;
  }

  return `${seconds.toFixed(2)} s`;
}

export function formatDelta(seconds) {
  if (seconds == null || Number.isNaN(seconds)) {
    return "—";
  }

  const sign = seconds > 0 ? "+" : "";
  return `${sign}${formatDuration(seconds)}`;
}

export function formatFactor(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `${value.toFixed(1)}x`;
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `${value.toFixed(0)}%`;
}

export function formatCount(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompactNumber(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCurrency(value, currency = "USD") {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return getCurrencyFormatter(currency).format(value);
}
