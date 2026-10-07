import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { provisionStudentUser } from "./db";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getStudentProfile: vi.fn(async (userId: number) => userId === 2 ? { userId } : undefined),
  getParentProfile: vi.fn(async (userId: number) => userId === 10 ? { userId } : undefined),
  getActiveChild: vi.fn(async (parentUserId: number, studentUserId: number) => parentUserId === 10 && studentUserId === 2 ? { student: { userId: 2 } } : undefined),
  getLearningProfile: vi.fn(async () => ({ studentUserId: 2 })),
  createParentStudentLink: vi.fn(async () => [{ id: 1, status: "pending" }]),
  listActiveChildren: vi.fn(async () => []),
  setRelationshipStatusWithAudit: vi.fn(async () => ({ before: { status: "pending" }, after: { status: "active" } })),
  upsertStudentProfile: vi.fn(async () => undefined),
  provisionStudentUser: vi.fn(async () => undefined),
  upsertLearningProfile: vi.fn(async () => undefined),
}));

type User = NonNullable<TrpcContext["user"]>;
function context(user: Partial<User> & { id: number; role: string }): TrpcContext {
  return { user: user as User, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("Phase 2 tRPC procedure authorization", () => {
  it("blocks a student from another profile and learning profile", async () => {
    const caller = appRouter.createCaller(context({ id: 1, role: "user" }));
    await expect(caller.student.profile.get({ userId: 2 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.student.profile.update({ userId: 2, fullName: "tamper" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.student.learningProfile.get({ studentUserId: 2 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.student.learningProfile.save({ studentUserId: 2, goal: "tamper" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("provisions the authenticated default user as a student after saving their profile", async () => {
    vi.mocked(provisionStudentUser).mockClear();
    const caller = appRouter.createCaller(context({ id: 1, role: "user" }));
    await caller.student.profile.update({ fullName: "طالب نُخبة" });
    expect(provisionStudentUser).toHaveBeenCalledWith(1);
  });

  it("blocks non-parents and invalid students from creating links", async () => {
    const studentCaller = appRouter.createCaller(context({ id: 1, role: "user" }));
    await expect(studentCaller.parent.children.link({ studentUserId: 2 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const adminCaller = appRouter.createCaller(context({ id: 3, role: "admin" }));
    await expect(adminCaller.parent.children.link({ studentUserId: 2 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const parentCaller = appRouter.createCaller(context({ id: 10, role: "parent" }));
    await expect(parentCaller.parent.children.link({ studentUserId: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("allows a parent to read only an active child and create a pending link", async () => {
    const caller = appRouter.createCaller(context({ id: 10, role: "parent" }));
    await expect(caller.parent.children.get({ studentUserId: 2 })).resolves.toMatchObject({ userId: 2 });
    await expect(caller.parent.children.get({ studentUserId: 9 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.parent.children.link({ studentUserId: 2 })).resolves.toMatchObject([{ status: "pending" }]);
  });

  it("allows only admin roles to change relationship status", async () => {
    const userCaller = appRouter.createCaller(context({ id: 1, role: "user" }));
    const parentCaller = appRouter.createCaller(context({ id: 10, role: "parent" }));
    await expect(userCaller.admin.relationships.setStatus({ id: 1, status: "active" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(parentCaller.admin.relationships.setStatus({ id: 1, status: "active" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context({ id: 3, role: "admin" })).admin.relationships.setStatus({ id: 1, status: "active" })).resolves.toBeUndefined();
    await expect(appRouter.createCaller(context({ id: 4, role: "super_admin" })).admin.relationships.setStatus({ id: 1, status: "revoked" })).resolves.toBeUndefined();
  });
});
