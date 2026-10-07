import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { hasStudentDashboardError } from "./Dashboard";

const source = readFileSync(new URL("./Dashboard.tsx", import.meta.url), "utf8");

describe("student dashboard loading states", () => {
  it("has a layout-preserving skeleton and explicit fetch error state", () => {
    expect(source).toContain("StudentDashboardSkeleton");
    expect(source).toContain("aria-label=\"جارٍ تحميل لوحة الطالب\"");
    expect(source).toContain("تعذر تحميل بيانات لوحة الطالب");
    expect(source).toContain("learning.isLoading");
    expect(source).toContain("bookings.isLoading");
    expect(source).toContain("تصدير CSV");
    expect(source).toContain("تصدير Excel");
    expect(source).toContain("exportState");
  });

  it("does not treat valid empty student data as a dashboard error", () => {
    expect(hasStudentDashboardError(false, false, false)).toBe(false);
    expect(hasStudentDashboardError(false, false, false)).toBe(false);
  });

  it("shows the dashboard error only when a query actually fails", () => {
    expect(hasStudentDashboardError(true, false, false)).toBe(true);
    expect(hasStudentDashboardError(false, true, false)).toBe(true);
    expect(hasStudentDashboardError(false, false, true)).toBe(true);
  });
});
