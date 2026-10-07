import { describe, expect, it } from "vitest";
import { buildStudentPdfDocument } from "./studentPdf";

describe("student PDF export", () => {
  it("contains only the authenticated student's real profile and course history", () => {
    const html = buildStudentPdfDocument({ user: { name: "طالب حقيقي", email: "real@example.com" }, profile: { fullName: "طالب حقيقي", educationStage: "ثانوي", grade: "ثاني ثانوي", preferredSubjects: ["رياضيات"] }, learning: { subject: "الجبر", goal: "رفع المستوى", level: "متقدم" }, bookings: [{ booking: { startAt: "2026-09-15T10:00:00.000Z", status: "completed" }, teacher: { fullName: "معلم حقيقي" } }] });
    expect(html).toContain("طالب حقيقي");
    expect(html).toContain("real@example.com");
    expect(html).toContain("معلم حقيقي");
    expect(html).toContain("الجبر");
    expect(html).not.toContain("طالب آخر");
    expect(html).toContain("window.print");
  });
  it("handles missing optional profile fields without breaking the document", () => {
    const html = buildStudentPdfDocument({ user: { email: null }, profile: {}, learning: {}, bookings: [] });
    expect(html).toContain("غير متوفر في الملف الحالي");
    expect(html).toContain("لا توجد حصص مسجلة");
  });
});
