import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { addStudentFavorite, listStudentFavorites, removeStudentFavorite } from "./db";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getStudentProfile: vi.fn(async () => undefined),
  getParentProfile: vi.fn(async () => undefined),
  getActiveChild: vi.fn(async () => undefined),
  getLearningProfile: vi.fn(async () => undefined),
  getUserById: vi.fn(async (id: number) => ({ id, role: "student", email: "student@example.com" })),
  listActiveChildren: vi.fn(async () => []),
  listStudentFavorites: vi.fn(async (studentUserId: number) => [{ id: studentUserId, studentUserId, favoriteType: "teacher", targetId: "12", title: "معلم حقيقي" }]),
  addStudentFavorite: vi.fn(async (studentUserId: number, favoriteType: "teacher" | "course", targetId: string, title: string) => [{ id: 1, studentUserId, favoriteType, targetId, title }]),
  removeStudentFavorite: vi.fn(async () => undefined),
  setRelationshipStatusWithAudit: vi.fn(async () => undefined),
  upsertStudentProfile: vi.fn(async () => undefined),
  provisionStudentUser: vi.fn(async () => undefined),
  upsertLearningProfile: vi.fn(async () => undefined),
}));
vi.mock("./booking", () => ({ listStudentBookings: vi.fn(async () => []), listTeacherBookings: vi.fn(async () => []), createBooking: vi.fn(), cancelStudentBooking: vi.fn(), createAvailability: vi.fn(), deleteAvailability: vi.fn(), getEligibleTeacherForPublicAvailability: vi.fn(), getTeacherForUser: vi.fn(), listAvailability: vi.fn(), updateAvailability: vi.fn(), updateTeacherBookingStatus: vi.fn() }));

type User = NonNullable<TrpcContext["user"]>;
function context(user: Partial<User> & { id: number; role: string }): TrpcContext { return { user: user as User, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("student favorites procedures", () => {
  it("allows a student to add, list, and remove only through their own context", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "student" }));
    await expect(caller.student.favorites.list()).resolves.toMatchObject([{ studentUserId: 7 }]);
    await expect(caller.student.favorites.add({ favoriteType: "teacher", targetId: "12", title: "معلم حقيقي" })).resolves.toMatchObject([{ studentUserId: 7, targetId: "12" }]);
    await expect(caller.student.favorites.remove({ favoriteType: "teacher", targetId: "12" })).resolves.toEqual({ success: true });
    await expect(caller.student.favorites.add({ favoriteType: "course", targetId: "course:algebra", title: "خطة الجبر" })).resolves.toMatchObject([{ studentUserId: 7, targetId: "course:algebra" }]);
    await expect(caller.student.favorites.remove({ favoriteType: "course", targetId: "course:algebra" })).resolves.toEqual({ success: true });
    expect(vi.mocked(listStudentFavorites)).toHaveBeenCalledWith(7);
    expect(vi.mocked(addStudentFavorite)).toHaveBeenCalledWith(7, "course", "course:algebra", "خطة الجبر");
    expect(vi.mocked(removeStudentFavorite)).toHaveBeenCalledWith(7, "course", "course:algebra");
  });
  it("exports only the authenticated student’s profile and booking history", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "student" }));
    await expect(caller.student.profile.exportData()).resolves.toMatchObject({ user: { id: 7 }, bookings: [] });
    const parentCaller = appRouter.createCaller(context({ id: 9, role: "parent" }));
    await expect(parentCaller.student.profile.exportData()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("blocks non-students from reading or changing favorites", async () => {
    const caller = appRouter.createCaller(context({ id: 8, role: "parent" }));
    await expect(caller.student.favorites.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.student.favorites.add({ favoriteType: "teacher", targetId: "12", title: "غير مسموح" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.student.favorites.remove({ favoriteType: "teacher", targetId: "12" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
