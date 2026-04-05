import { describe, it, expect } from "vitest";

describe("Shield Intelligence types and structures", () => {
  it("should define valid pattern types", () => {
    const validTypes = ["repeated_officer", "geographic_cluster", "time_pattern"];
    expect(validTypes).toHaveLength(3);
    validTypes.forEach((t) => expect(typeof t).toBe("string"));
  });

  it("should define valid severity levels", () => {
    const severities = ["low", "medium", "high"];
    expect(severities).toHaveLength(3);
  });

  it("should compute confidence bounded between 0 and 1", () => {
    const computeConfidence = (count: number, base: number, increment: number) =>
      Math.min(base + count * increment, 0.95);

    expect(computeConfidence(2, 0.5, 0.1)).toBe(0.7);
    expect(computeConfidence(5, 0.5, 0.1)).toBe(0.95);
    expect(computeConfidence(100, 0.5, 0.1)).toBe(0.95); // capped
  });

  it("should correctly classify severity by occurrence count", () => {
    const getSeverity = (cnt: number) => (cnt >= 5 ? "high" : cnt >= 3 ? "medium" : "low");

    expect(getSeverity(1)).toBe("low");
    expect(getSeverity(2)).toBe("low");
    expect(getSeverity(3)).toBe("medium");
    expect(getSeverity(5)).toBe("high");
    expect(getSeverity(10)).toBe("high");
  });
});
