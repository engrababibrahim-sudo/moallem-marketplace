import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const auditSpy = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("./db", () => ({
  getStudentProfile: vi.fn(async () => undefined),
  getUserById: vi.fn(async (id: number) => ({ id, role: id === 99 ? "super_admin" : "student", accountStatus: "active" })),
  countSuperAdmins: vi.fn(async () => 2),
  updateUserAccessWithAudit: vi.fn(async (id: number, data: Record<string, string | undefined>, actorUserId: number) => { if (data.role) auditSpy({ action: "role.change", actorUserId, targetUserId: id }); if (data.accountStatus) auditSpy({ action: "account_status.change", actorUserId, targetUserId: id }); return { before: { id, role: "student", accountStatus: "active" }, after: { id, ...data } }; }),
}));

type User = NonNullable<TrpcContext["user"]>;
function context(user: Partial<User> & { id: number; role: string; accountStatus?: string }): TrpcContext {
  return { user: user as User, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("Phase 2.5 role and identity procedures", () => {
  it("blocks normal users and admins from assigning super_admin", async () => {
    await expect(appRouter.createCaller(context({ id: 1, role: "user" })).admin.users.updateAccess({ targetUserId: 2, role: "admin" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context({ id: 3, role: "admin" })).admin.users.updateAccess({ targetUserId: 2, role: "super_admin" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows super_admin to assign super_admin to another user and records the role change", async () => {
    auditSpy.mockClear();
    await expect(appRouter.createCaller(context({ id: 3, role: "super_admin" })).admin.users.updateAccess({ targetUserId: 2, role: "super_admin", reason: "security team" })).resolves.toMatchObject({ role: "super_admin" });
    expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({ action: "role.change", actorUserId: 3, targetUserId: 2 }));
  });

  it("prevents self role changes and records account status changes", async () => {
    await expect(appRouter.createCaller(context({ id: 3, role: "super_admin" })).admin.users.updateAccess({ targetUserId: 3, role: "admin" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    auditSpy.mockClear();
    await expect(appRouter.createCaller(context({ id: 3, role: "super_admin" })).admin.users.updateAccess({ targetUserId: 2, accountStatus: "suspended" })).resolves.toBeDefined();
    expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({ action: "account_status.change" }));
  });

  it("blocks suspended users and allows active users through protected procedures", async () => {
    await expect(appRouter.createCaller(context({ id: 1, role: "student", accountStatus: "suspended" })).student.profile.get()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context({ id: 1, role: "student", accountStatus: "active" })).student.profile.get()).resolves.toBeUndefined();
  });
});
