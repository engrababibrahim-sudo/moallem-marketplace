import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  InsertUser,
  learningProfiles,
  parentProfiles,
  parentStudentRelationships,
  studentFavorites,
  studentProfiles,
  teacherProfiles,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
export async function getUserById(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}
export async function getStudentProfile(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
  return result[0];
}
export async function listStudentsForAdmin() {
  const db = await getDb(); if (!db) return [];
  return db.select({ user: users, profile: studentProfiles, learning: learningProfiles })
    .from(users)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .leftJoin(learningProfiles, eq(learningProfiles.studentUserId, users.id))
    .where(eq(users.role, "student"))
    .orderBy(desc(users.createdAt))
    .limit(500);
}
export async function getParentProfile(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(parentProfiles).where(eq(parentProfiles.userId, userId)).limit(1);
  return result[0];
}
export async function upsertStudentProfile(userId: number, data: Omit<Partial<typeof studentProfiles.$inferInsert>, "userId">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(studentProfiles).values({ ...data, userId, preferredSubjects: data.preferredSubjects ?? [], preferredAvailability: data.preferredAvailability ?? [] }).onDuplicateKeyUpdate({ set: { ...data, updatedAt: new Date() } });
  return getStudentProfile(userId);
}
export async function provisionStudentUser(userId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(users).set({ role: "student", updatedAt: new Date() }).where(and(eq(users.id, userId), eq(users.role, "user")));
}
export async function getLearningProfile(studentUserId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(learningProfiles).where(eq(learningProfiles.studentUserId, studentUserId)).limit(1);
  return result[0];
}
export async function upsertLearningProfile(studentUserId: number, data: Omit<Partial<typeof learningProfiles.$inferInsert>, "studentUserId">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(learningProfiles).values({ ...data, studentUserId, answers: data.answers ?? {} }).onDuplicateKeyUpdate({ set: { ...data, updatedAt: new Date() } });
  return getLearningProfile(studentUserId);
}

export async function listStudentFavorites(studentUserId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(studentFavorites).where(eq(studentFavorites.studentUserId, studentUserId)).orderBy(desc(studentFavorites.createdAt));
}

export async function addStudentFavorite(studentUserId: number, favoriteType: "teacher" | "course", targetId: string, title: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(studentFavorites).values({ studentUserId, favoriteType, targetId, title }).onDuplicateKeyUpdate({ set: { title } });
  return db.select().from(studentFavorites).where(and(eq(studentFavorites.studentUserId, studentUserId), eq(studentFavorites.favoriteType, favoriteType), eq(studentFavorites.targetId, targetId))).limit(1);
}

export async function removeStudentFavorite(studentUserId: number, favoriteType: "teacher" | "course", targetId: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.delete(studentFavorites).where(and(eq(studentFavorites.studentUserId, studentUserId), eq(studentFavorites.favoriteType, favoriteType), eq(studentFavorites.targetId, targetId)));
}
export async function listActiveChildren(parentUserId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({ relationship: parentStudentRelationships, student: studentProfiles, user: users })
    .from(parentStudentRelationships).innerJoin(studentProfiles, eq(studentProfiles.userId, parentStudentRelationships.studentUserId)).innerJoin(users, eq(users.id, studentProfiles.userId))
    .where(and(eq(parentStudentRelationships.parentUserId, parentUserId), eq(parentStudentRelationships.status, "active")));
}
export async function getActiveChild(parentUserId: number, studentUserId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select({ relationship: parentStudentRelationships, student: studentProfiles, user: users })
    .from(parentStudentRelationships).innerJoin(studentProfiles, eq(studentProfiles.userId, parentStudentRelationships.studentUserId)).innerJoin(users, eq(users.id, studentProfiles.userId))
    .where(and(eq(parentStudentRelationships.parentUserId, parentUserId), eq(parentStudentRelationships.studentUserId, studentUserId), eq(parentStudentRelationships.status, "active"))).limit(1);
  return result[0];
}
export async function createParentStudentLink(parentUserId: number, studentUserId: number, relationshipType = "parent") {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(parentProfiles).values({ userId: parentUserId }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  await db.insert(parentStudentRelationships).values({ parentUserId, studentUserId, relationshipType }).onDuplicateKeyUpdate({ set: { relationshipType, updatedAt: new Date() } });
  return db.select().from(parentStudentRelationships).where(and(eq(parentStudentRelationships.parentUserId, parentUserId), eq(parentStudentRelationships.studentUserId, studentUserId))).limit(1);
}
export async function listRelationshipsForAdmin() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(parentStudentRelationships).limit(100);
}
export async function getRelationshipById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(parentStudentRelationships).where(eq(parentStudentRelationships.id, id)).limit(1);
  return result[0];
}
export async function setRelationshipStatus(id: number, status: "active" | "revoked" | "pending") {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(parentStudentRelationships).set({ status, updatedAt: new Date() }).where(eq(parentStudentRelationships.id, id));
}
export async function countSuperAdmins() {
  const db = await getDb(); if (!db) return 0;
  const result = await db.select({ id: users.id }).from(users).where(eq(users.role, "super_admin"));
  return result.length;
}

export type AccessChange = { role?: "user" | "student" | "parent" | "teacher" | "admin" | "super_admin" | "support"; accountStatus?: "active" | "suspended" | "deactivated" };
export async function updateUserAccessWithAudit(targetUserId: number, data: AccessChange, actorUserId: number, reason?: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const result = await tx.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    const before = result[0]; if (!before) return undefined;
    await tx.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, targetUserId));
    if (data.role !== undefined && data.role !== before.role) await tx.insert(auditLogs).values({ actorUserId, targetUserId, action: "role.change", entityType: "user", entityId: targetUserId, oldValue: { role: before.role }, newValue: { role: data.role }, reason });
    if (data.accountStatus !== undefined && data.accountStatus !== before.accountStatus) await tx.insert(auditLogs).values({ actorUserId, targetUserId, action: "account_status.change", entityType: "user", entityId: targetUserId, oldValue: { accountStatus: before.accountStatus }, newValue: { accountStatus: data.accountStatus }, reason });
    if (data.role === "parent") await tx.insert(parentProfiles).values({ userId: targetUserId }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
    return { before, after: { ...before, ...data } };
  });
}

export async function setRelationshipStatusWithAudit(id: number, status: "active" | "revoked" | "pending", actorUserId: number, reason?: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const result = await tx.select().from(parentStudentRelationships).where(eq(parentStudentRelationships.id, id)).limit(1);
    const before = result[0]; if (!before) return undefined;
    await tx.update(parentStudentRelationships).set({ status, updatedAt: new Date() }).where(eq(parentStudentRelationships.id, id));
    if (before.status !== status) await tx.insert(auditLogs).values({ actorUserId, targetUserId: before.studentUserId, action: "relationship_status.change", entityType: "parent_student_relationship", entityId: id, oldValue: { status: before.status }, newValue: { status }, reason });
    return { before, after: { ...before, status } };
  });
}
