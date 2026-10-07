import { describe, expect, it } from "vitest";
import { isPublicMarketplaceCandidate, toPublicMarketplaceTeacher } from "./marketplace";

const base = { id: 1, name: "معلم", avatarUrl: null, bio: "نبذة", qualification: "مؤهل", specialization: "رياضيات", yearsOfExperience: 4, subjects: ["رياضيات"], educationStages: ["ثانوي"], grades: ["ثاني"], teachingFormat: "فردي", hourlyRate: 100, availability: ["مساء"], role: "teacher", accountStatus: "active", verificationStatus: "approved", phone: "private", email: "private@example.com", rejectionReason: "private", reviewedBy: 99, auditLogs: [] };
describe("Marketplace hardening", () => {
  it.each([
    ["approved teacher", { role: "teacher", accountStatus: "active", verificationStatus: "approved" }, true],
    ["pending teacher", { role: "teacher", accountStatus: "active", verificationStatus: "pending" }, false],
    ["rejected teacher", { role: "teacher", accountStatus: "active", verificationStatus: "rejected" }, false],
    ["suspended teacher", { role: "teacher", accountStatus: "active", verificationStatus: "suspended" }, false],
    ["inactive account", { role: "teacher", accountStatus: "suspended", verificationStatus: "approved" }, false],
    ["non-teacher role", { role: "student", accountStatus: "active", verificationStatus: "approved" }, false],
  ])("visibility: %s", (_name, state, expected) => expect(isPublicMarketplaceCandidate({ ...base, ...state })).toBe(expected));
  it("returns only intentionally public fields", () => {
    const result = toPublicMarketplaceTeacher(base);
    expect(result).toEqual({ id: 1, name: "معلم", avatarUrl: null, country: null, bio: "نبذة", qualification: "مؤهل", specialization: "رياضيات", yearsOfExperience: 4, subjects: ["رياضيات"], educationStages: ["ثانوي"], grades: ["ثاني"], teachingFormat: "فردي", hourlyRate: 100, availability: ["مساء"] });
    for (const key of ["phone", "email", "rejectionReason", "reviewedBy", "auditLogs", "role", "accountStatus", "verificationStatus", "userId"]) expect(Object.prototype.hasOwnProperty.call(result, key)).toBe(false);
  });
  it("exposes the public country label for country-aware discovery", () => {
    expect(toPublicMarketplaceTeacher({ ...base, country: "مصر" })).toMatchObject({ country: "مصر" });
  });
});
