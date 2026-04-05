import { describe, it, expect } from "vitest";
import { anonymizeIncident, anonymizeReport } from "../lib/anonymize";

describe("Anonymization layer", () => {
  it("should anonymize incident data", () => {
    const incident = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Officer Smith used excessive force",
      description: "Officer John Smith (Badge #1234) used a taser at 123 Main St",
      location: "123 Main St, Springfield, IL",
      status: "reported",
      created_at: new Date("2024-01-15T12:00:00Z"),
      officer_badge: "1234",
      officer_name: "John Smith",
    };

    const result = anonymizeIncident(incident);

    expect(result.officer_badge).toBeNull();
    expect(result.officer_name).toBeNull();
    expect(result.id).not.toBe(incident.id);
    expect(result.id.length).toBe(12);
    expect(result.title).not.toContain("Smith");
    expect(result.description).not.toContain("John Smith");
    expect(result.description).not.toContain("Badge #1234");
    expect(result.date).toBe("2024-01-15");
  });

  it("should generalize location", () => {
    const incident = {
      id: "test-id",
      title: "Test incident",
      description: null,
      location: "123 Main St, Springfield, IL",
      status: "pending",
      created_at: new Date(),
      officer_badge: null,
      officer_name: null,
    };

    const result = anonymizeIncident(incident);
    expect(result.location_area).toBe("Springfield, IL");
  });

  it("should anonymize report data", () => {
    const report = {
      id: "report-id-123",
      title: "Report: Officer Davis at Main Street",
      summary: "Officer James Davis was observed using force",
      findings: ["Officer Davis used a baton", "Badge #5678 was identified"],
      recommendations: ["Consult with attorney"],
      created_at: new Date("2024-02-20T10:00:00Z"),
    };

    const result = anonymizeReport(report);

    expect(result.id).not.toBe(report.id);
    expect(result.title).not.toContain("Davis");
    expect(result.summary).not.toContain("James Davis");
    expect(result.findings[1]).not.toContain("Badge #5678");
    expect(result.date).toBe("2024-02-20");
  });

  it("should handle null values gracefully", () => {
    const incident = {
      id: "null-test",
      title: "Simple incident",
      description: null,
      location: null,
      status: "pending",
      created_at: new Date(),
      officer_badge: null,
      officer_name: null,
    };

    const result = anonymizeIncident(incident);
    expect(result.description).toBeNull();
    expect(result.location_area).toBeNull();
  });
});
