import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const profile = { id: 10, userId: 7, fullName: "معلم تجريبي", qualification: "بكالوريوس", specialization: "رياضيات", subjects: ["رياضيات"], educationStages: ["ثانوي"], grades: ["ثاني"], yearsOfExperience: 5, verificationStatus: "pending", rejectionReason: null };
vi.mock("./teacher-db", () => ({
  getTeacherApplication: vi.fn(async () => undefined),
  createTeacherApplication: vi.fn(async (userId: number) => ({ ...profile, userId })),
  updateTeacherApplication: vi.fn(async (userId: number) => ({ ...profile, userId })),
  submitTeacherApplication: vi.fn(async (userId: number) => ({ ...profile, userId, verificationStatus: "pending" })),
  getTeacherApplicationById: vi.fn(async () => ({ profile, user: { id: 7, role: "student", accountStatus: "active" } })),
  listTeacherApplications: vi.fn(async () => [{ profile, user: { id: 7, role: "student", accountStatus: "active" } }]),
  reviewTeacherApplication: vi.fn(async (_id: number, action: string) => ({ ...profile, verificationStatus: action === "approve" ? "approved" : action === "reject" ? "rejected" : "suspended" })),
  listPublicTeachers: vi.fn(async () => [{ id: 10, userId: 7, name: "معلم معتمد", avatarUrl: null, bio: "نبذة", qualification: "بكالوريوس", specialization: "رياضيات", yearsOfExperience: 5, subjects: ["رياضيات"], educationStages: ["ثانوي"], grades: ["ثاني"], teachingFormat: "فردي", hourlyRate: 100, availability: ["مساء"], role: "teacher", accountStatus: "active", verificationStatus: "approved" }]),
}));

type User = NonNullable<TrpcContext["user"]>;
function context(user?: Partial<User> & { id: number; role: string; accountStatus?: string }): TrpcContext { return { user: user as User, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
const valid = { fullName: "معلم تجريبي", qualification: "بكالوريوس", specialization: "رياضيات", subjects: ["رياضيات"], educationStages: ["ثانوي"], grades: ["ثاني"], yearsOfExperience: 5 };

describe("Phase 3 teacher registration and approval", () => {
  it("requires authentication and lets a student create only their own application", async () => {
    await expect(appRouter.createCaller(context()).teacher.application.create(valid)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(appRouter.createCaller(context({ id: 7, role: "student" })).teacher.application.create(valid)).resolves.toMatchObject({ userId: 7, verificationStatus: "pending" });
  });
  it("does not expose arbitrary userId inputs and keeps parent/teacher within their own context", async () => {
    const parent = appRouter.createCaller(context({ id: 8, role: "parent" }));
    await expect(parent.teacher.application.update({ fullName: "ولي الأمر" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    const teacher = appRouter.createCaller(context({ id: 9, role: "teacher" }));
    await expect(teacher.teacher.application.get()).resolves.toBeUndefined();
  });
  it("allows admin and super_admin review but blocks student, teacher, and support", async () => {
    for (const role of ["student", "teacher", "support"]) await expect(appRouter.createCaller(context({ id: 3, role })).admin.teachers.approve({ id: 10 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context({ id: 20, role: "admin" })).admin.teachers.approve({ id: 10 })).resolves.toMatchObject({ verificationStatus: "approved" });
    await expect(appRouter.createCaller(context({ id: 21, role: "super_admin" })).admin.teachers.approve({ id: 10 })).resolves.toMatchObject({ verificationStatus: "approved" });
  });
  it("requires rejection reason and keeps unapproved teachers out of the public feed", async () => {
    await expect(appRouter.createCaller(context({ id: 20, role: "admin" })).admin.teachers.reject({ id: 10, rejectionReason: " " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(appRouter.createCaller(context({ id: 20, role: "admin" })).admin.teachers.reject({ id: 10, rejectionReason: "يرجى إضافة المؤهل" })).resolves.toMatchObject({ verificationStatus: "rejected" });
    await expect(appRouter.createCaller(context()).marketplace.teachers()).resolves.toEqual([{ id: 10, name: "معلم معتمد", avatarUrl: null, country: null, bio: "نبذة", qualification: "بكالوريوس", specialization: "رياضيات", yearsOfExperience: 5, subjects: ["رياضيات"], educationStages: ["ثانوي"], grades: ["ثاني"], teachingFormat: "فردي", hourlyRate: 100, availability: ["مساء"] }]);
  });
  it("prevents self approval", async () => {
    await expect(appRouter.createCaller(context({ id: 7, role: "admin" })).admin.teachers.approve({ id: 10 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
