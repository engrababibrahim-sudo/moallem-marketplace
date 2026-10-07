import {
  date,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table backing Manus OAuth. */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", [
      "user",
      "student",
      "parent",
      "teacher",
      "admin",
      "super_admin",
      "support",
    ])
      .default("user")
      .notNull(),
    accountStatus: mysqlEnum("accountStatus", [
      "active",
      "suspended",
      "deactivated",
    ])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .onUpdateNow()
      .notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => ({
    usersMarketplaceVisibility: index("users_marketplace_visibility").on(
      table.role,
      table.accountStatus,
    ),
  }),
);

export const studentProfiles = mysqlTable("student_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .unique()
    .references(() => users.id),
  fullName: varchar("fullName", { length: 255 }),
  educationStage: varchar("educationStage", { length: 100 }),
  grade: varchar("grade", { length: 100 }),
  preferredSubjects: json("preferredSubjects")
    .$type<string[]>()
    .notNull(),
  learningLevel: varchar("learningLevel", { length: 100 }),
  learningGoals: text("learningGoals"),
  strengths: text("strengths"),
  difficulties: text("difficulties"),
  preferredLearningFormat: varchar("preferredLearningFormat", {
    length: 100,
  }),
  preferredAvailability: json("preferredAvailability")
    .$type<string[]>()
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});

export const parentProfiles = mysqlTable("parent_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .unique()
    .references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});

export const parentStudentRelationships = mysqlTable(
  "parent_student_relationships",
  {
    id: int("id").autoincrement().primaryKey(),
    parentUserId: int("parentUserId")
      .notNull()
      .references(() => users.id),
    studentUserId: int("studentUserId")
      .notNull()
      .references(() => users.id),
    relationshipType: varchar("relationshipType", { length: 50 }).default(
      "parent",
    ),
    status: mysqlEnum("status", ["pending", "active", "revoked"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => ({
    parentStudentUnique: uniqueIndex("parent_student_unique").on(
      table.parentUserId,
      table.studentUserId,
    ),
  }),
);

export const learningProfiles = mysqlTable("learning_profiles", {
  id: int("id").autoincrement().primaryKey(),
  studentUserId: int("studentUserId")
    .notNull()
    .unique()
    .references(() => users.id),
  role: varchar("role", { length: 100 }),
  grade: varchar("grade", { length: 100 }),
  stage: varchar("stage", { length: 100 }),
  subject: varchar("subject", { length: 150 }),
  goal: text("goal"),
  level: varchar("level", { length: 100 }),
  difficulties: text("difficulties"),
  needs: text("needs"),
  format: varchar("format", { length: 150 }),
  availability: varchar("availability", { length: 150 }),
  time: varchar("time", { length: 150 }),
  answers: json("answers")
    .$type<Record<string, string>>()
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});

export const studentFavorites = mysqlTable(
  "student_favorites",
  {
    id: int("id").autoincrement().primaryKey(),
    studentUserId: int("studentUserId")
      .notNull()
      .references(() => users.id),
    favoriteType: mysqlEnum("favoriteType", ["teacher", "course"]).notNull(),
    targetId: varchar("targetId", { length: 128 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    studentFavoriteUnique: uniqueIndex("student_favorite_unique").on(
      table.studentUserId,
      table.favoriteType,
      table.targetId,
    ),
    studentFavoriteLookup: index("student_favorite_lookup").on(
      table.studentUserId,
      table.favoriteType,
    ),
  }),
);

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId")
    .notNull()
    .references(() => users.id),
  targetUserId: int("targetUserId").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId"),
  oldValue: json("oldValue").$type<Record<string, unknown> | null>(),
  newValue: json("newValue").$type<Record<string, unknown> | null>(),
  reason: text("reason"),
  requestId: varchar("requestId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const teacherProfiles = mysqlTable(
  "teacher_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .unique()
      .references(() => users.id),
    fullName: varchar("fullName", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 100 }),
    profilePhotoUrl: varchar("profilePhotoUrl", { length: 500 }),
    bio: text("bio"),
    qualification: varchar("qualification", { length: 255 }),
    specialization: varchar("specialization", { length: 255 }),
    yearsOfExperience: int("yearsOfExperience").default(0).notNull(),
    subjects: json("subjects").$type<string[]>().notNull(),
    educationStages: json("educationStages").$type<string[]>().notNull(),
    grades: json("grades").$type<string[]>().notNull(),
    teachingFormat: varchar("teachingFormat", { length: 100 }),
    hourlyRate: int("hourlyRate"),
    availability: json("availability").$type<string[]>().notNull(),
    verificationStatus: mysqlEnum("verificationStatus", [
      "pending",
      "approved",
      "rejected",
      "suspended",
    ])
      .default("pending")
      .notNull(),
    rejectionReason: text("rejectionReason"),
    submittedAt: timestamp("submittedAt"),
    reviewedAt: timestamp("reviewedAt"),
    reviewedBy: int("reviewedBy").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => ({
    teacherVerificationIndex: index("teacher_verification_idx").on(
      table.verificationStatus,
    ),
  }),
);

export const teacherAvailability = mysqlTable(
  "teacher_availability",
  {
    id: int("id").autoincrement().primaryKey(),
    teacherId: int("teacherId")
      .notNull()
      .references(() => teacherProfiles.id),
    dayOfWeek: int("dayOfWeek"),
    specificDate: date("specificDate", { mode: "string" }),
    startTime: varchar("startTime", { length: 5 }).notNull(),
    endTime: varchar("endTime", { length: 5 }).notNull(),
    timezone: varchar("timezone", { length: 64 })
      .default("UTC")
      .notNull(),
    status: mysqlEnum("status", ["active", "inactive"])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => ({
    teacherAvailabilityLookup: index("teacher_availability_lookup").on(
      table.teacherId,
      table.status,
      table.dayOfWeek,
      table.specificDate,
    ),
  }),
);

export const bookings = mysqlTable(
  "bookings",
  {
    id: int("id").autoincrement().primaryKey(),

    studentId: int("studentId")
      .notNull()
      .references(() => users.id),

    teacherId: int("teacherId")
      .notNull()
      .references(() => teacherProfiles.id),

    subject: varchar("subject", { length: 255 }),

    startAt: timestamp("startAt").notNull(),

    endAt: timestamp("endAt").notNull(),

    durationMinutes: int("durationMinutes"),

    timezone: varchar("timezone", { length: 64 })
      .default("UTC")
      .notNull(),

    hourlyRateSnapshot: int("hourlyRateSnapshot"),

    totalPrice: int("totalPrice"),

    currency: varchar("currency", { length: 10 })
      .default("EGP")
      .notNull(),

    status: mysqlEnum("status", [
      "pending",
      "confirmed",
      "cancelled",
      "completed",
      "rejected",
    ])
      .default("pending")
      .notNull(),

    paymentStatus: mysqlEnum("paymentStatus", [
      "unpaid",
      "pending",
      "paid",
      "failed",
      "refunded",
    ])
      .default("unpaid")
      .notNull(),

    notes: text("notes"),

    cancelledBy: mysqlEnum("cancelledBy", [
      "student",
      "teacher",
      "admin",
      "system",
    ]),

    cancelledAt: timestamp("cancelledAt"),

    cancellationReason: text("cancellationReason"),

    completedAt: timestamp("completedAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),

    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => ({
    bookingsTeacherTime: index("bookings_teacher_time").on(
      table.teacherId,
      table.startAt,
      table.endAt,
      table.status,
    ),

    bookingsStudentTime: index("bookings_student_time").on(
      table.studentId,
      table.startAt,
      table.endAt,
      table.status,
    ),

    bookingsTeacherStatus: index("bookings_teacher_status").on(
      table.teacherId,
      table.status,
      table.startAt,
    ),

    bookingsStudentStatus: index("bookings_student_status").on(
      table.studentId,
      table.status,
      table.startAt,
    ),

    bookingsPaymentStatus: index("bookings_payment_status").on(
      table.paymentStatus,
      table.status,
    ),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type ParentProfile = typeof parentProfiles.$inferSelect;
export type ParentStudentRelationship =
  typeof parentStudentRelationships.$inferSelect;
export type LearningProfile = typeof learningProfiles.$inferSelect;
export type StudentFavorite = typeof studentFavorites.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type Booking = typeof bookings.$inferSelect;

export type StudentProfileInput = typeof studentProfiles.$inferInsert;
export type LearningProfileInput = typeof learningProfiles.$inferInsert;
export type BookingInput = typeof bookings.$inferInsert;
