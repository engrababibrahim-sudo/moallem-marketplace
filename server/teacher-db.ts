import { and, desc, eq } from "drizzle-orm";
import { auditLogs, teacherProfiles, users } from "../drizzle/schema";
import { getDb } from "./db";

export type TeacherApplicationInput = Omit<Partial<typeof teacherProfiles.$inferInsert>, "userId" | "id" | "verificationStatus" | "reviewedBy" | "reviewedAt" | "rejectionReason" | "submittedAt"> & { fullName: string };

export async function getTeacherApplication(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId)).limit(1);
  return rows[0];
}

export async function createTeacherApplication(userId: number, input: TeacherApplicationInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(teacherProfiles).values({ ...input, userId, subjects: input.subjects ?? [], educationStages: input.educationStages ?? [], grades: input.grades ?? [], availability: input.availability ?? [], verificationStatus: "pending" });
  return getTeacherApplication(userId);
}

export async function updateTeacherApplication(userId: number, input: Partial<TeacherApplicationInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(teacherProfiles).set({ ...input, updatedAt: new Date() }).where(eq(teacherProfiles.userId, userId));
  return getTeacherApplication(userId);
}

export async function submitTeacherApplication(userId: number, actorUserId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const rows = await tx.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId)).limit(1);
    const profile = rows[0]; if (!profile) return undefined;
    if (!["pending", "rejected"].includes(profile.verificationStatus)) throw new Error("لا يمكن إعادة إرسال هذا الطلب في حالته الحالية");
    await tx.update(teacherProfiles).set({ verificationStatus: "pending", rejectionReason: null, submittedAt: new Date(), updatedAt: new Date() }).where(eq(teacherProfiles.userId, userId));
    await tx.insert(auditLogs).values({ actorUserId, targetUserId: userId, action: "teacher.application.submit", entityType: "teacher_profile", entityId: profile.id, oldValue: { verificationStatus: profile.verificationStatus }, newValue: { verificationStatus: "pending" } });
    return { ...profile, verificationStatus: "pending" as const, rejectionReason: null, submittedAt: new Date() };
  });
}

export async function listTeacherApplications() {
  const db = await getDb(); if (!db) return [];
  return db.select({ profile: teacherProfiles, user: users }).from(teacherProfiles).innerJoin(users, eq(users.id, teacherProfiles.userId)).orderBy(desc(teacherProfiles.submittedAt)).limit(200);
}

export async function getTeacherApplicationById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select({ profile: teacherProfiles, user: users }).from(teacherProfiles).innerJoin(users, eq(users.id, teacherProfiles.userId)).where(eq(teacherProfiles.id, id)).limit(1);
  return rows[0];
}

export async function reviewTeacherApplication(id: number, action: "approve" | "reject" | "suspend", actorUserId: number, reason?: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const rows = await tx.select({ profile: teacherProfiles, user: users }).from(teacherProfiles).innerJoin(users, eq(users.id, teacherProfiles.userId)).where(eq(teacherProfiles.id, id)).limit(1);
    const current = rows[0]; if (!current) return undefined;
    const oldStatus = current.profile.verificationStatus;
    if (action === "approve" && !["pending", "rejected"].includes(oldStatus)) throw new Error("لا يمكن اعتماد الطلب في حالته الحالية");
    if (action === "reject" && !reason?.trim()) throw new Error("سبب الرفض مطلوب");
    if (action === "suspend" && oldStatus !== "approved") throw new Error("لا يمكن تعليق معلم غير معتمد");
    const nextStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "suspended";
    await tx.update(teacherProfiles).set({ verificationStatus: nextStatus, rejectionReason: action === "reject" ? reason!.trim() : null, reviewedAt: new Date(), reviewedBy: actorUserId, updatedAt: new Date() }).where(eq(teacherProfiles.id, id));
    if (action === "approve") {
      await tx.update(users).set({ role: "teacher", updatedAt: new Date() }).where(eq(users.id, current.user.id));
      await tx.insert(auditLogs).values({ actorUserId, targetUserId: current.user.id, action: "role.change", entityType: "user", entityId: current.user.id, oldValue: { role: current.user.role }, newValue: { role: "teacher" } });
    }
    await tx.insert(auditLogs).values({ actorUserId, targetUserId: current.user.id, action: `teacher.application.${action}`, entityType: "teacher_profile", entityId: id, oldValue: { verificationStatus: oldStatus }, newValue: { verificationStatus: nextStatus }, reason: action === "reject" ? reason!.trim() : undefined });
    return { ...current.profile, verificationStatus: nextStatus, rejectionReason: action === "reject" ? reason!.trim() : null };
  });
}

export async function listPublicTeachers(page = 1, pageSize = 50) {
  const db = await getDb(); if (!db) return [];
  const safePage = Math.max(1, Math.floor(page)); const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));
  return db.select({ id: teacherProfiles.id, userId: teacherProfiles.userId, name: teacherProfiles.fullName, avatarUrl: teacherProfiles.profilePhotoUrl, country: teacherProfiles.country, bio: teacherProfiles.bio, qualification: teacherProfiles.qualification, specialization: teacherProfiles.specialization, yearsOfExperience: teacherProfiles.yearsOfExperience, subjects: teacherProfiles.subjects, educationStages: teacherProfiles.educationStages, grades: teacherProfiles.grades, teachingFormat: teacherProfiles.teachingFormat, hourlyRate: teacherProfiles.hourlyRate, availability: teacherProfiles.availability, role: users.role, accountStatus: users.accountStatus, verificationStatus: teacherProfiles.verificationStatus }).from(teacherProfiles).innerJoin(users, eq(users.id, teacherProfiles.userId)).where(and(eq(users.role, "teacher"), eq(users.accountStatus, "active"), eq(teacherProfiles.verificationStatus, "approved"))).limit(safePageSize).offset((safePage - 1) * safePageSize);
}
