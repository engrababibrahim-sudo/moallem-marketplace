import { describe, expect, it } from "vitest";
import { canAccessStudent, canEditRelationship, isAdmin } from "./authorization";

describe("Phase 2 authorization rules", () => {
  it("limits a student to their own profile", () => {
    expect(canAccessStudent({ id: 10, role: "user" }, 10)).toBe(true);
    expect(canAccessStudent({ id: 10, role: "user" }, 11)).toBe(false);
  });
  it("limits parents to active linked children", () => {
    expect(canAccessStudent({ id: 20, role: "user" }, 11, [11])).toBe(true);
    expect(canAccessStudent({ id: 20, role: "user" }, 12, [11])).toBe(false);
  });
  it("allows both admin roles to manage relationships", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("super_admin")).toBe(true);
    expect(canEditRelationship({ id: 1, role: "admin" })).toBe(true);
    expect(canEditRelationship({ id: 1, role: "user" })).toBe(false);
  });
});
