import { describe, expect, it } from "vitest";
import { rolePermissions, type BookingRequest, type NukhbaRole } from "./nukhba";

describe("Nukhba role permissions", () => {
  it("keeps every supported role explicit", () => {
    const roles: NukhbaRole[] = ["student", "parent", "teacher", "admin", "super_admin", "support"];
    for (const role of roles) expect(rolePermissions[role]).toBeDefined();
  });

  it("limits student and parent access to their intended scopes", () => {
    expect(rolePermissions.student).toContain("report:read:own");
    expect(rolePermissions.student).not.toContain("users:read");
    expect(rolePermissions.parent).toContain("report:read:children");
    expect(rolePermissions.parent).not.toContain("teacher:review");
  });

  it("keeps privileged administration separate", () => {
    expect(rolePermissions.admin).toContain("teacher:review");
    expect(rolePermissions.super_admin).toEqual(["*"]);
  });
});

describe("booking contract", () => {
  it("represents payment as an explicit future provider state", () => {
    const booking: BookingRequest = {
      studentId: 1,
      teacherId: 2,
      startsAtUtc: Date.UTC(2026, 8, 20, 15),
      durationMinutes: 60,
      currencyCode: "SAR",
      paymentStatus: "not_configured",
    };
    expect(booking.paymentStatus).toBe("not_configured");
    expect(booking.currencyCode).toBe("SAR");
  });
});
