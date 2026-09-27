export default function getCssVar(name) {
  if (typeof window === "undefined") {
    return "";
  }

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
