import {
  and,
  eq,
  gt,
  lt,
  or,
  asc,
  desc,
} from "drizzle-orm";

import {
  bookings,
  teacherAvailability,
  teacherProfiles,
  users,
} from "../drizzle/schema";

import { getDb } from "./db";

/* =========================================================
   TYPES
========================================================= */

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "rejected";

export type BookingCancellationActor =
  | "student"
  | "teacher"
  | "admin"
  | "system";

export type BookingPaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

/* =========================================================
   TEACHER ELIGIBILITY
========================================================= */

export function isEligibleTeacherState(state: {
  role: string;
  accountStatus: string;
  verificationStatus: string;
}) {
  return (
    state.role === "teacher" &&
    state.accountStatus === "active" &&
    state.verificationStatus === "approved"
  );
}

/* =========================================================
   TIME HELPERS
========================================================= */

export function intervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
) {
  return startA < endB && endA > startB;
}

function localSlot(
  date: Date,
  timezone: string,
) {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: timezone,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
  )
    .formatToParts(date)
    .reduce<Record<string, string>>(
      (acc, part) => {
        acc[part.type] = part.value;
        return acc;
      },
      {},
    );

  const weekday = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ].indexOf(parts.weekday);

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    dayOfWeek: weekday,
    time: `${parts.hour}:${parts.minute}`,
  };
}

function ensureTimeWindow(
  startAt: Date,
  endAt: Date,
) {
  if (
    !Number.isFinite(startAt.getTime()) ||
    !Number.isFinite(endAt.getTime()) ||
    startAt >= endAt
  ) {
    throw new Error(
      "نافذة الوقت غير صالحة",
    );
  }
}

function getDurationMinutes(
  startAt: Date,
  endAt: Date,
) {
  const duration =
    Math.round(
      (endAt.getTime() -
        startAt.getTime()) /
        60000,
    );

  if (
    !Number.isFinite(duration) ||
    duration < 15 ||
    duration > 8 * 60
  ) {
    throw new Error(
      "مدة الحجز يجب أن تكون بين 15 دقيقة و8 ساعات",
    );
  }

  return duration;
}

/* =========================================================
   TEACHER
========================================================= */

async function getEligibleTeacher(
  tx: any,
  teacherId: number,
) {
  const rows = await tx
    .select({
      profile: teacherProfiles,
      user: users,
    })
    .from(teacherProfiles)
    .innerJoin(
      users,
      eq(
        users.id,
        teacherProfiles.userId,
      ),
    )
    .where(
      eq(
        teacherProfiles.id,
        teacherId,
      ),
    )
    .for("update")
    .limit(1);

  const teacher = rows[0];

  if (!teacher) {
    throw new Error(
      "المعلم غير موجود",
    );
  }

  if (
    !isEligibleTeacherState({
      role: teacher.user.role,
      accountStatus:
        teacher.user.accountStatus,
      verificationStatus:
        teacher.profile
          .verificationStatus,
    })
  ) {
    throw new Error(
      "المعلم غير متاح للحجز",
    );
  }

  return teacher;
}

/* =========================================================
   TEACHER FOR CURRENT USER
========================================================= */

export async function getTeacherForUser(
  userId: number,
) {
  const db = await getDb();

  if (!db) {
    return undefined;
  }

  const rows = await db
    .select({
      profile: teacherProfiles,
      user: users,
    })
    .from(teacherProfiles)
    .innerJoin(
      users,
      eq(
        users.id,
        teacherProfiles.userId,
      ),
    )
    .where(eq(users.id, userId))
    .limit(1);

  return rows[0];
}

/* =========================================================
   PUBLIC TEACHER AVAILABILITY
========================================================= */

export async function getEligibleTeacherForPublicAvailability(
  teacherId: number,
) {
  const db = await getDb();

  if (!db) {
    return undefined;
  }

  const rows = await db
    .select({
      profile: teacherProfiles,
      user: users,
    })
    .from(teacherProfiles)
    .innerJoin(
      users,
      eq(
        users.id,
        teacherProfiles.userId,
      ),
    )
    .where(
      and(
        eq(
          teacherProfiles.id,
          teacherId,
        ),
        eq(
          teacherProfiles.verificationStatus,
          "approved",
        ),
        eq(
          users.role,
          "teacher",
        ),
        eq(
          users.accountStatus,
          "active",
        ),
      ),
    )
    .limit(1);

  return rows[0]?.profile;
}

/* =========================================================
   AVAILABILITY VALIDATION
========================================================= */

async function assertAvailability(
  tx: any,
  teacherId: number,
  startAt: Date,
  endAt: Date,
  timezone: string,
) {
  const start = localSlot(
    startAt,
    timezone,
  );

  const end = localSlot(
    endAt,
    timezone,
  );

  if (
    start.date !== end.date ||
    start.dayOfWeek !==
      end.dayOfWeek
  ) {
    throw new Error(
      "يجب أن يكون الحجز داخل يوم واحد",
    );
  }

  const rows = await tx
    .select()
    .from(teacherAvailability)
    .where(
      and(
        eq(
          teacherAvailability.teacherId,
          teacherId,
        ),
        eq(
          teacherAvailability.status,
          "active",
        ),
      ),
    );

  const allowed = rows.some(
    (
      slot: typeof teacherAvailability.$inferSelect,
    ) => {
      const dateMatches =
        slot.specificDate ===
        start.date;

      const recurrenceMatches =
        slot.specificDate === null &&
        slot.dayOfWeek ===
          start.dayOfWeek;

      return (
        (dateMatches ||
          recurrenceMatches) &&
        slot.startTime <= start.time &&
        slot.endTime >= end.time
      );
    },
  );

  if (!allowed) {
    throw new Error(
      "الوقت خارج مواعيد توفر المعلم",
    );
  }
}

/* =========================================================
   BOOKING CONFLICT
========================================================= */

function conflictWhere(
  ownerField:
    | typeof bookings.teacherId
    | typeof bookings.studentId,
  ownerId: number,
  startAt: Date,
  endAt: Date,
) {
  return and(
    eq(ownerField, ownerId),

    or(
      eq(
        bookings.status,
        "pending",
      ),
      eq(
        bookings.status,
        "confirmed",
      ),
    ),

    lt(
      bookings.startAt,
      endAt,
    ),

    gt(
      bookings.endAt,
      startAt,
    ),
  );
}

/* =========================================================
   PRICE CALCULATION
========================================================= */

function calculateTotalPrice(
  hourlyRate: number | null,
  durationMinutes: number,
) {
  const rate =
    Number(hourlyRate ?? 0);

  if (
    !Number.isFinite(rate) ||
    rate < 0
  ) {
    throw new Error(
      "سعر ساعة المعلم غير صالح",
    );
  }

  return Math.round(
    rate *
      (durationMinutes / 60),
  );
}

/* =========================================================
   CREATE BOOKING
========================================================= */

export async function createBooking(
  studentId: number,
  input: {
    teacherId: number;
    subject?: string | null;
    startAt: Date;
    endAt: Date;
    timezone: string;
    notes?: string | null;
  },
) {
  const db = await getDb();

  if (!db) {
    throw new Error(
      "Database unavailable",
    );
  }

  ensureTimeWindow(
    input.startAt,
    input.endAt,
  );

  const durationMinutes =
    getDurationMinutes(
      input.startAt,
      input.endAt,
    );

  return db.transaction(
    async (tx) => {
      /* -----------------------------------------------------
         STUDENT
      ----------------------------------------------------- */

      const studentRows =
        await tx
          .select()
          .from(users)
          .where(
            eq(users.id, studentId),
          )
          .for("update")
          .limit(1);

      const student =
        studentRows[0];

      if (
        !student ||
        student.role !==
          "student" ||
        student.accountStatus !==
          "active"
      ) {
        throw new Error(
          "الطالب غير مصرح له بالحجز",
        );
      }

      /* -----------------------------------------------------
         TEACHER
      ----------------------------------------------------- */

      const teacher =
        await getEligibleTeacher(
          tx,
          input.teacherId,
        );

      /* -----------------------------------------------------
         AVAILABILITY
      ----------------------------------------------------- */

      await assertAvailability(
        tx,
        input.teacherId,
        input.startAt,
        input.endAt,
        input.timezone,
      );

      /* -----------------------------------------------------
         TEACHER CONFLICT
      ----------------------------------------------------- */

      const teacherConflict =
        await tx
          .select({
            id: bookings.id,
          })
          .from(bookings)
          .where(
            conflictWhere(
              bookings.teacherId,
              input.teacherId,
              input.startAt,
              input.endAt,
            ),
          )
          .limit(1);

      if (
        teacherConflict.length
      ) {
        throw new Error(
          "الموعد محجوز للمعلم",
        );
      }

      /* -----------------------------------------------------
         STUDENT CONFLICT
      ----------------------------------------------------- */

      const studentConflict =
        await tx
          .select({
            id: bookings.id,
          })
          .from(bookings)
          .where(
            conflictWhere(
              bookings.studentId,
              studentId,
              input.startAt,
              input.endAt,
            ),
          )
          .limit(1);

      if (
        studentConflict.length
      ) {
        throw new Error(
          "لدى الطالب حجز متعارض",
        );
      }

      /* -----------------------------------------------------
         PRICE SNAPSHOT
      ----------------------------------------------------- */

      const hourlyRateSnapshot =
        teacher.profile.hourlyRate ??
        0;

      const totalPrice =
        calculateTotalPrice(
          hourlyRateSnapshot,
          durationMinutes,
        );

      /* -----------------------------------------------------
         CREATE
      ----------------------------------------------------- */

      const result =
        await tx
          .insert(bookings)
          .values({
            studentId,

            teacherId:
              input.teacherId,

            subject:
              input.subject ??
              null,

            startAt:
              input.startAt,

            endAt:
              input.endAt,

            timezone:
              input.timezone,

            durationMinutes,

            hourlyRateSnapshot,

            totalPrice,

            currency: "EGP",

            paymentStatus:
              "unpaid",

            status:
              "pending",

            notes:
              input.notes ??
              null,
          });

      const id = Number(
        result[0].insertId,
      );

      /* -----------------------------------------------------
         RETURN CREATED BOOKING
      ----------------------------------------------------- */

      const created =
        await tx
          .select()
          .from(bookings)
          .where(
            eq(bookings.id, id),
          )
          .limit(1);

      return created[0];
    },
  );
}

/* =========================================================
   GET STUDENT BOOKING
========================================================= */

export async function getStudentBooking(
  studentId: number,
  bookingId: number,
) {
  const db = await getDb();

  if (!db) {
    return undefined;
  }

  const rows = await db
    .select({
      booking: bookings,
      teacher:
        teacherProfiles,
    })
    .from(bookings)
    .innerJoin(
      teacherProfiles,
      eq(
        teacherProfiles.id,
        bookings.teacherId,
      ),
    )
    .where(
      and(
        eq(
          bookings.id,
          bookingId,
        ),
        eq(
          bookings.studentId,
          studentId,
        ),
      ),
    )
    .limit(1);

  return rows[0];
}

/* =========================================================
   GET TEACHER BOOKING
========================================================= */

export async function getTeacherBooking(
  teacherId: number,
  bookingId: number,
) {
  const db = await getDb();

  if (!db) {
    return undefined;
  }

  const rows = await db
    .select({
      booking: bookings,
      student: users,
    })
    .from(bookings)
    .innerJoin(
      users,
      eq(
        users.id,
        bookings.studentId,
      ),
    )
    .where(
      and(
        eq(
          bookings.id,
          bookingId,
        ),
        eq(
          bookings.teacherId,
          teacherId,
        ),
      ),
    )
    .limit(1);

  return rows[0];
}

/* =========================================================
   LIST STUDENT BOOKINGS
========================================================= */

export async function listStudentBookings(
  studentId: number,
) {
  const db = await getDb();

  if (!db) {
    return [];
  }

  return db
    .select({
      booking: bookings,
      teacher:
        teacherProfiles,
    })
    .from(bookings)
    .innerJoin(
      teacherProfiles,
      eq(
        teacherProfiles.id,
        bookings.teacherId,
      ),
    )
    .where(
      eq(
        bookings.studentId,
        studentId,
      ),
    )
    .orderBy(
      desc(bookings.startAt),
    );
}

/* =========================================================
   LIST TEACHER BOOKINGS
========================================================= */

export async function listTeacherBookings(
  teacherId: number,
) {
  const db = await getDb();

  if (!db) {
    return [];
  }

  return db
    .select({
      booking: bookings,
      student: users,
    })
    .from(bookings)
    .innerJoin(
      users,
      eq(
        users.id,
        bookings.studentId,
      ),
    )
    .where(
      eq(
        bookings.teacherId,
        teacherId,
      ),
    )
    .orderBy(
      asc(bookings.startAt),
    );
}

/* =========================================================
   AVAILABILITY LIST
========================================================= */

export async function listAvailability(
  teacherId: number,
) {
  const db = await getDb();

  if (!db) {
    return [];
  }

  return db
    .select()
    .from(teacherAvailability)
    .where(
      eq(
        teacherAvailability.teacherId,
        teacherId,
      ),
    )
    .orderBy(
      asc(
        teacherAvailability.specificDate,
      ),
      asc(
        teacherAvailability.dayOfWeek,
      ),
      asc(
        teacherAvailability.startTime,
      ),
    );
}

/* =========================================================
   CREATE AVAILABILITY
========================================================= */

export async function createAvailability(
  teacherId: number,
  input: {
    dayOfWeek?: number | null;
    specificDate?: string | null;
    startTime: string;
    endTime: string;
    timezone: string;
  },
) {
  const db = await getDb();

  if (!db) {
    throw new Error(
      "Database unavailable",
    );
  }

  if (
    input.dayOfWeek == null &&
    !input.specificDate
  ) {
    throw new Error(
      "حدد يومًا متكررًا أو تاريخًا محددًا",
    );
  }

  if (
    input.dayOfWeek != null &&
    (input.dayOfWeek < 0 ||
      input.dayOfWeek > 6)
  ) {
    throw new Error(
      "اليوم غير صالح",
    );
  }

  if (
    input.startTime >=
    input.endTime
  ) {
    throw new Error(
      "وقت البداية يجب أن يسبق النهاية",
    );
  }

  const result =
    await db
      .insert(teacherAvailability)
      .values({
        teacherId,
        ...input,
      });

  return (
    await listAvailability(
      teacherId,
    )
  ).find(
    (row) =>
      row.id ===
      Number(
        result[0].insertId,
      ),
  );
}

/* =========================================================
   UPDATE AVAILABILITY
========================================================= */

export async function updateAvailability(
  teacherId: number,
  id: number,
  input: Partial<{
    dayOfWeek: number | null;
    specificDate: string | null;
    startTime: string;
    endTime: string;
    timezone: string;
    status:
      | "active"
      | "inactive";
  }>,
) {
  const db = await getDb();

  if (!db) {
    throw new Error(
      "Database unavailable",
    );
  }

  const current = (
    await db
      .select()
      .from(teacherAvailability)
      .where(
        and(
          eq(
            teacherAvailability.id,
            id,
          ),
          eq(
            teacherAvailability.teacherId,
            teacherId,
          ),
        ),
      )
      .limit(1)
  )[0];

  if (!current) {
    return undefined;
  }

  const next = {
    ...current,
    ...input,
  };

  if (
    next.dayOfWeek == null &&
    !next.specificDate
  ) {
    throw new Error(
      "حدد يومًا متكررًا أو تاريخًا محددًا",
    );
  }

  if (
    next.startTime >=
    next.endTime
  ) {
    throw new Error(
      "وقت البداية يجب أن يسبق النهاية",
    );
  }

  await db
    .update(teacherAvailability)
    .set({
      ...input,
      updatedAt:
        new Date(),
    })
    .where(
      and(
        eq(
          teacherAvailability.id,
          id,
        ),
        eq(
          teacherAvailability.teacherId,
          teacherId,
        ),
      ),
    );

  return (
    await db
      .select()
      .from(teacherAvailability)
      .where(
        eq(
          teacherAvailability.id,
          id,
        ),
      )
      .limit(1)
  )[0];
}

/* =========================================================
   DELETE AVAILABILITY
========================================================= */

export async function deleteAvailability(
  teacherId: number,
  id: number,
) {
  const db = await getDb();

  if (!db) {
    throw new Error(
      "Database unavailable",
    );
  }

  const result =
    await db
      .update(teacherAvailability)
      .set({
        status:
          "inactive",
        updatedAt:
          new Date(),
      })
      .where(
        and(
          eq(
            teacherAvailability.id,
            id,
          ),
          eq(
            teacherAvailability.teacherId,
            teacherId,
          ),
        ),
      );

  return result;
}

/* =========================================================
   CANCEL STUDENT BOOKING
========================================================= */

export async function cancelStudentBooking(
  studentId: number,
  id: number,
  reason?: string | null,
) {
  const db = await getDb();

  if (!db) {
    throw new Error(
      "Database unavailable",
    );
  }

  const current =
    (
      await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(
              bookings.id,
              id,
            ),
            eq(
              bookings.studentId,
              studentId,
            ),
          ),
        )
        .limit(1)
    )[0];

  if (!current) {
    throw new Error(
      "الحجز غير موجود",
    );
  }

  if (
    current.status !==
      "pending" &&
    current.status !==
      "confirmed"
  ) {
    throw new Error(
      "لا يمكن إلغاء هذا الحجز في حالته الحالية",
    );
  }

  await db
    .update(bookings)
    .set({
      status:
        "cancelled",

      cancelledBy:
        "student",

      cancelledAt:
        new Date(),

      cancellationReason:
        reason ??
        null,

      updatedAt:
        new Date(),
    })
    .where(
      and(
        eq(
          bookings.id,
          id,
        ),
        eq(
          bookings.studentId,
          studentId,
        ),
      ),
    );

  return (
    await db
      .select()
      .from(bookings)
      .where(
        eq(
          bookings.id,
          id,
        ),
      )
      .limit(1)
  )[0];
}

/* =========================================================
   UPDATE TEACHER BOOKING STATUS
========================================================= */

export async function updateTeacherBookingStatus(
  teacherId: number,
  id: number,
  status: BookingStatus,
  reason?: string | null,
) {
  const db = await getDb();

  if (!db) {
    throw new Error(
      "Database unavailable",
    );
  }

  const allowed: Record<
    BookingStatus,
    BookingStatus[]
  > = {
    pending: [
      "confirmed",
      "rejected",
      "cancelled",
    ],

    confirmed: [
      "completed",
      "cancelled",
    ],

    cancelled: [],

    completed: [],

    rejected: [],
  };

  const current = (
    await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(
            bookings.id,
            id,
          ),
          eq(
            bookings.teacherId,
            teacherId,
          ),
        ),
      )
      .limit(1)
  )[0];

  if (!current) {
    return undefined;
  }

  if (
    !allowed[current.status]?.includes(
      status,
    )
  ) {
    throw new Error(
      "انتقال حالة الحجز غير مسموح",
    );
  }

  const updateData: Record<
    string,
    unknown
  > = {
    status,
    updatedAt:
      new Date(),
  };

  if (
    status ===
      "cancelled" ||
    status ===
      "rejected"
  ) {
    updateData.cancelledBy =
      "teacher";

    updateData.cancelledAt =
      new Date();

    updateData.cancellationReason =
      reason ??
      null;
  }

  if (
    status ===
    "completed"
  ) {
    updateData.completedAt =
      new Date();
  }

  await db
    .update(bookings)
    .set(updateData)
    .where(
      and(
        eq(
          bookings.id,
          id,
        ),
        eq(
          bookings.teacherId,
          teacherId,
        ),
      ),
    );

  return (
    await db
      .select()
      .from(bookings)
      .where(
        eq(
          bookings.id,
          id,
        ),
      )
      .limit(1)
  )[0];
}
