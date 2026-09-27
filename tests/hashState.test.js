import { describe, expect, it } from "vitest";
import { buildHash, parseHash } from "../lib/hashState";

describe("hashState", () => {
  it("parses known profiler keys from a hash fragment", () => {
    expect(parseHash("#country=uk&incomePoints=301&variable=income_tax")).toEqual({
      country: "uk",
      incomePoints: "301",
      variable: "income_tax",
    });
  });

  it("omits the country for embedded US links", () => {
    expect(
      buildHash({
        country: "us",
        incomePoints: 401,
        variable: "aca_ptc",
        isEmbedded: true,
      }),
    ).toBe("#incomePoints=401&variable=aca_ptc");
  });

  it("keeps non-US countries in standalone links", () => {
    expect(
      buildHash({
        country: "uk",
        incomePoints: 201,
        variable: "universal_credit",
        isEmbedded: false,
      }),
    ).toBe("#incomePoints=201&variable=universal_credit&country=uk");
  });
});
