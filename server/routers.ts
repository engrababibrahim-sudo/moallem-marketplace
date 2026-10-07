import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  parentProcedure,
  privilegedProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";
import { canCreateParentChildLink, isAdmin } from "./authorization";
import {
  createParentStudentLink,
  countSuperAdmins,
  getActiveChild,
  getLearningProfile,
  getParentProfile,
  getStudentProfile,
  listStudentsForAdmin,
  getUserById,
  listActiveChildren,
  listStudentFavorites,
  setRelationshipStatusWithAudit,
  addStudentFavorite,
  removeStudentFavorite,
  upsertLearningProfile,
  upsertStudentProfile,
  provisionStudentUser,
  updateUserAccessWithAudit,
} from "./db";
import {
  createTeacherApplication,
  getTeacherApplication,
  getTeacherApplicationById,
  listTeacherApplications,
  reviewTeacherApplication,
  submitTeacherApplication,
  updateTeacherApplication,
} from "./teacher-db";
import { listPublicMarketplaceTeachers } from "./marketplace";
import {
  cancelStudentBooking,
  createAvailability,
  createBooking,
  deleteAvailability,
  getEligibleTeacherForPublicAvailability,
  getTeacherForUser,
  listAvailability,
  listStudentBookings,
  listTeacherBookings,
  updateAvailability,
  updateTeacherBookingStatus,
} from "./booking";

const studentProfileInput = z.object({
  fullName: z.string().max(255).optional().nullable(),
  educationStage: z.string().max(100).optional().nullable(),
  grade: z.string().max(100).optional().nullable(),
  preferredSubjects: z.array(z.string().max(100)).max(30).optional(),
  learningLevel: z.string().max(100).optional().nullable(),
  learningGoals: z.string().max(5000).optional().nullable(),
  strengths: z.string().max(5000).optional().nullable(),
  difficulties: z.string().max(5000).optional().nullable(),
  preferredLearningFormat: z.string().max(100).optional().nullable(),
  preferredAvailability: z.array(z.string().max(100)).max(30).optional(),
});

const learningProfileInput = z.object({
  role: z.string().max(100).optional().nullable(),
  grade: z.string().max(100).optional().nullable(),
  stage: z.string().max(100).optional().nullable(),
  subject: z.string().max(150).optional().nullable(),
  goal: z.string().max(5000).optional().nullable(),
  level: z.string().max(100).optional().nullable(),
  difficulties: z.string().max(5000).optional().nullable(),
  needs: z.string().max(5000).optional().nullable(),
  format: z.string().max(150).optional().nullable(),
  availability: z.string().max(150).optional().nullable(),
  time: z.string().max(150).optional().nullable(),
  answers: z.record(z.string(), z.string()).optional(),
});

const teacherApplicationInput = z.object({
  fullName: z.string().trim().min(2).max(255),
  phone: z.string().max(50).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  profilePhotoUrl: z.string().url().max(500).optional().nullable(),
  bio: z.string().max(5000).optional().nullable(),
  qualification: z.string().max(255).optional().nullable(),
  specialization: z.string().max(255).optional().nullable(),
  yearsOfExperience: z.number().int().min(0).max(80).optional(),
  subjects: z.array(z.string().max(100)).max(50).optional(),
  educationStages: z.array(z.string().max(100)).max(30).optional(),
  grades: z.array(z.string().max(100)).max(50).optional(),
  teachingFormat: z.string().max(100).optional().nullable(),
  hourlyRate: z.number().int().min(0).max(100000).optional().nullable(),
  availability: z.array(z.string().max(150)).max(100).optional(),
});

function assertSelfOrAdmin(
  actor: { id: number; role: string },
  targetUserId?: number,
) {
  if (
    targetUserId !== undefined &&
    targetUserId !== actor.id &&
    !isAdmin(actor.role)
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "ليس لديك صلاحية الوصول إلى هذا الملف",
    });
  }
}

const availabilityInput = z.object({
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  specificDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().min(1).max(64).default("UTC"),
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, {
        ...cookieOptions,
        maxAge: -1,
      });
      return { success: true } as const;
    }),
  }),

  student: router({
    favorites: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.role !== "student") throw new TRPCError({ code: "FORBIDDEN", message: "المفضلة متاحة للطلاب فقط" });
        return listStudentFavorites(ctx.user.id);
      }),
      add: protectedProcedure.input(z.object({ favoriteType: z.enum(["teacher", "course"]), targetId: z.string().trim().min(1).max(128), title: z.string().trim().min(1).max(255) })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "student") throw new TRPCError({ code: "FORBIDDEN", message: "المفضلة متاحة للطلاب فقط" });
        return addStudentFavorite(ctx.user.id, input.favoriteType, input.targetId, input.title);
      }),
      remove: protectedProcedure.input(z.object({ favoriteType: z.enum(["teacher", "course"]), targetId: z.string().trim().min(1).max(128) })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "student") throw new TRPCError({ code: "FORBIDDEN", message: "المفضلة متاحة للطلاب فقط" });
        await removeStudentFavorite(ctx.user.id, input.favoriteType, input.targetId);
        return { success: true } as const;
      }),
    }),
    profile: router({
      get: protectedProcedure
        .input(
          z
            .object({
              userId: z.number().int().positive().optional(),
            })
            .optional(),
        )
        .query(({ ctx, input }) => {
          const userId = input?.userId ?? ctx.user.id;
          assertSelfOrAdmin(ctx.user, userId);
          return getStudentProfile(userId);
        }),

      exportData: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.role !== "student") throw new TRPCError({ code: "FORBIDDEN", message: "تصدير الملف متاح للطلاب فقط" });
        const [user, profile, learning, bookings] = await Promise.all([getUserById(ctx.user.id), getStudentProfile(ctx.user.id), getLearningProfile(ctx.user.id), listStudentBookings(ctx.user.id)]);
        return { user, profile, learning, bookings };
      }),

      update: protectedProcedure
        .input(
          studentProfileInput.extend({
            userId: z.number().int().positive().optional(),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          const { userId = ctx.user.id, ...data } = input;
          assertSelfOrAdmin(ctx.user, userId);
          const profile = await upsertStudentProfile(userId, data);
          if (userId === ctx.user.id && ctx.user.role === "user") {
            await provisionStudentUser(ctx.user.id);
          }
          return profile;
        }),
    }),

    learningProfile: router({
      get: protectedProcedure
        .input(
          z
            .object({
              studentUserId: z.number().int().positive().optional(),
            })
            .optional(),
        )
        .query(async ({ ctx, input }) => {
          const studentUserId = input?.studentUserId ?? ctx.user.id;

          if (studentUserId !== ctx.user.id && !isAdmin(ctx.user.role)) {
            const child = await getActiveChild(ctx.user.id, studentUserId);

            if (!child) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "هذا الطالب غير مرتبط بحسابك",
              });
            }
          }

          return getLearningProfile(studentUserId);
        }),

      save: protectedProcedure
        .input(
          learningProfileInput.extend({
            studentUserId: z.number().int().positive().optional(),
          }),
        )
        .mutation(({ ctx, input }) => {
          const { studentUserId = ctx.user.id, ...data } = input;
          assertSelfOrAdmin(ctx.user, studentUserId);
          return upsertLearningProfile(studentUserId, data);
        }),
    }),

    booking: router({
      create: protectedProcedure
        .input(
          z.object({
            teacherId: z.number().int().positive(),
            startAt: z.string().datetime(),
            endAt: z.string().datetime(),
            timezone: z.string().min(1).max(64).default("UTC"),
            notes: z.string().max(5000).optional().nullable(),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          if (
            ctx.user.role !== "student" ||
            ctx.user.accountStatus !== "active"
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "هذا الإجراء متاح للطالب النشط فقط",
            });
          }

          return createBooking(ctx.user.id, {
            teacherId: input.teacherId,
            startAt: new Date(input.startAt),
            endAt: new Date(input.endAt),
            timezone: input.timezone,
            notes: input.notes ?? null,
          });
        }),

      list: protectedProcedure.query(async ({ ctx }) => {
        if (
          ctx.user.role !== "student" ||
          ctx.user.accountStatus !== "active"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "هذا الإجراء متاح للطالب النشط فقط",
          });
        }

        return listStudentBookings(ctx.user.id);
      }),

      cancel: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          if (
            ctx.user.role !== "student" ||
            ctx.user.accountStatus !== "active"
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "هذا الإجراء متاح للطالب النشط فقط",
            });
          }

          return cancelStudentBooking(ctx.user.id, input.id);
        }),
    }),
  }),

  parent: router({
    children: router({
      list: protectedProcedure.query(({ ctx }) =>
        listActiveChildren(ctx.user.id),
      ),

      get: protectedProcedure
        .input(z.object({ studentUserId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          if (isAdmin(ctx.user.role)) {
            return getStudentProfile(input.studentUserId);
          }

          const child = await getActiveChild(
            ctx.user.id,
            input.studentUserId,
          );

          if (!child) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "هذا الطالب غير مرتبط بحسابك",
            });
          }

          return child.student;
        }),

      link: parentProcedure
        .input(
          z.object({
            studentUserId: z.number().int().positive(),
            relationshipType: z.string().max(50).default("parent"),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          const parentProfile = await getParentProfile(ctx.user.id);

          if (
            !canCreateParentChildLink(
              ctx.user,
              Boolean(parentProfile),
            )
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "هذا الإجراء متاح لولي الأمر فقط",
            });
          }

          if (ctx.user.id === input.studentUserId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "لا يمكن ربط الحساب بنفسه",
            });
          }

          const studentProfile = await getStudentProfile(
            input.studentUserId,
          );

          if (!studentProfile) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "ملف الطالب غير موجود",
            });
          }

          return createParentStudentLink(
            ctx.user.id,
            input.studentUserId,
            input.relationshipType,
          );
        }),
    }),
  }),

  teacher: router({
    application: router({
      get: protectedProcedure.query(({ ctx }) =>
        getTeacherApplication(ctx.user.id),
      ),

      create: protectedProcedure
        .input(teacherApplicationInput)
        .mutation(async ({ ctx, input }) => {
          if (await getTeacherApplication(ctx.user.id)) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "يوجد طلب معلم لهذا الحساب بالفعل",
            });
          }

          return createTeacherApplication(ctx.user.id, input);
        }),

      update: protectedProcedure
        .input(teacherApplicationInput.partial())
        .mutation(async ({ ctx, input }) => {
          const existing = await getTeacherApplication(ctx.user.id);

          if (!existing) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "أنشئ طلب المعلم أولًا",
            });
          }

          if (existing.verificationStatus === "suspended") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "لا يمكن تعديل طلب معلق",
            });
          }

          return updateTeacherApplication(ctx.user.id, input);
        }),

      submit: protectedProcedure.mutation(async ({ ctx }) => {
        const existing = await getTeacherApplication(ctx.user.id);

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "أنشئ طلب المعلم أولًا",
          });
        }

        if (
          !existing.fullName ||
          !existing.qualification ||
          !existing.specialization ||
          !existing.subjects.length ||
          !existing.educationStages.length ||
          !existing.grades.length
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "أكمل البيانات المهنية والمواد والصفوف قبل الإرسال",
          });
        }

        return submitTeacherApplication(ctx.user.id, ctx.user.id);
      }),
    }),

    availability: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (
          ctx.user.role !== "teacher" ||
          ctx.user.accountStatus !== "active"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "هذا الإجراء متاح للمعلم النشط فقط",
          });
        }

        const teacher = await getTeacherForUser(ctx.user.id);

        if (!teacher) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "ملف المعلم غير موجود",
          });
        }

        return listAvailability(teacher.profile.id);
      }),

      create: protectedProcedure
        .input(availabilityInput)
        .mutation(async ({ ctx, input }) => {
          if (
            ctx.user.role !== "teacher" ||
            ctx.user.accountStatus !== "active"
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "هذا الإجراء متاح للمعلم النشط فقط",
            });
          }

          const teacher = await getTeacherForUser(ctx.user.id);

          if (!teacher) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "ملف المعلم غير موجود",
            });
          }

          if (teacher.profile.verificationStatus !== "approved") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "يجب اعتماد حساب المعلم أولًا",
            });
          }

          return createAvailability(teacher.profile.id, input);
        }),

      update: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            dayOfWeek: z
              .number()
              .int()
              .min(0)
              .max(6)
              .nullable()
              .optional(),
            specificDate: z
              .string()
              .regex(/^\d{4}-\d{2}-\d{2}$/)
              .nullable()
              .optional(),
            startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
            endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
            timezone: z.string().min(1).max(64).optional(),
            status: z.enum(["active", "inactive"]).optional(),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          if (
            ctx.user.role !== "teacher" ||
            ctx.user.accountStatus !== "active"
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "هذا الإجراء متاح للمعلم النشط فقط",
            });
          }

          const teacher = await getTeacherForUser(ctx.user.id);

          if (!teacher) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "ملف المعلم غير موجود",
            });
          }

          const { id, ...data } = input;

          return updateAvailability(
            teacher.profile.id,
            id,
            data,
          );
        }),

      delete: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          if (
            ctx.user.role !== "teacher" ||
            ctx.user.accountStatus !== "active"
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "هذا الإجراء متاح للمعلم النشط فقط",
            });
          }

          const teacher = await getTeacherForUser(ctx.user.id);

          if (!teacher) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "ملف المعلم غير موجود",
            });
          }

          return deleteAvailability(
            teacher.profile.id,
            input.id,
          );
        }),
    }),

    booking: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (
          ctx.user.role !== "teacher" ||
          ctx.user.accountStatus !== "active"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "هذا الإجراء متاح للمعلم النشط فقط",
          });
        }

        const teacher = await getTeacherForUser(ctx.user.id);

        if (!teacher) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "ملف المعلم غير موجود",
          });
        }

        return listTeacherBookings(teacher.profile.id);
      }),

      get: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          if (
            ctx.user.role !== "teacher" ||
            ctx.user.accountStatus !== "active"
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "هذا الإجراء متاح للمعلم النشط فقط",
            });
          }

          const teacher = await getTeacherForUser(ctx.user.id);

          if (!teacher) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "ملف المعلم غير موجود",
            });
          }

          const rows = await listTeacherBookings(
            teacher.profile.id,
          );

          return rows.find(
            (item) => item.booking.id === input.id,
          );
        }),

      updateStatus: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            status: z.enum([
              "confirmed",
              "rejected",
              "completed",
              "cancelled",
            ]),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          if (
            ctx.user.role !== "teacher" ||
            ctx.user.accountStatus !== "active"
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "هذا الإجراء متاح للمعلم النشط فقط",
            });
          }

          const teacher = await getTeacherForUser(ctx.user.id);

          if (!teacher) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "ملف المعلم غير موجود",
            });
          }

          return updateTeacherBookingStatus(
            teacher.profile.id,
            input.id,
            input.status,
          );
        }),
    }),
  }),

  marketplace: router({
    teachers: publicProcedure
      .input(
        z
          .object({
            page: z.number().int().min(1).default(1),
            pageSize: z.number().int().min(1).max(100).default(50),
          })
          .optional(),
      )
      .query(({ input }) =>
        listPublicMarketplaceTeachers(
          input?.page ?? 1,
          input?.pageSize ?? 50,
        ),
      ),

    availability: publicProcedure
      .input(
        z.object({
          teacherId: z.number().int().positive(),
        }),
      )
      .query(async ({ input }) => {
        const teacher =
          await getEligibleTeacherForPublicAvailability(
            input.teacherId,
          );

        if (!teacher) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "المعلم غير متاح للحجز",
          });
        }

        return listAvailability(teacher.id);
      }),
  }),

  admin: router({
    overview: privilegedProcedure.query(async () => {
      const students = await listStudentsForAdmin();
      const teachers = await listTeacherApplications();
      return { studentCount: students.length, teacherCount: teachers.length };
    }),
    students: router({
      list: privilegedProcedure.query(() => listStudentsForAdmin()),
    }),
    teachers: router({
      list: privilegedProcedure.query(() =>
        listTeacherApplications(),
      ),

      get: privilegedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .query(async ({ input }) => {
          const result = await getTeacherApplicationById(input.id);

          if (!result) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "طلب المعلم غير موجود",
            });
          }

          return result;
        }),

      approve: privilegedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const current = await getTeacherApplicationById(
            input.id,
          );

          if (!current) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "طلب المعلم غير موجود",
            });
          }

          if (current.user.id === ctx.user.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "لا يمكن اعتماد طلب الحساب الحالي",
            });
          }

          if (
            !current.profile.fullName ||
            !current.profile.qualification ||
            !current.profile.specialization ||
            !current.profile.subjects.length ||
            !current.profile.educationStages.length ||
            !current.profile.grades.length
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "طلب المعلم غير مكتمل",
            });
          }

          return reviewTeacherApplication(
            input.id,
            "approve",
            ctx.user.id,
          );
        }),

      reject: privilegedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            rejectionReason: z.string().trim().min(1).max(2000),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          const current = await getTeacherApplicationById(
            input.id,
          );

          if (!current) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "طلب المعلم غير موجود",
            });
          }

          if (current.user.id === ctx.user.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "لا يمكن رفض طلب الحساب الحالي",
            });
          }

          return reviewTeacherApplication(
            input.id,
            "reject",
            ctx.user.id,
            input.rejectionReason,
          );
        }),

      suspend: privilegedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            reason: z.string().max(1000).optional(),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          const current = await getTeacherApplicationById(
            input.id,
          );

          if (!current) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "طلب المعلم غير موجود",
            });
          }

          if (current.user.id === ctx.user.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "لا يمكن تعليق الحساب الحالي",
            });
          }

          return reviewTeacherApplication(
            input.id,
            "suspend",
            ctx.user.id,
            input.reason,
          );
        }),
    }),

    users: router({
      updateAccess: privilegedProcedure
        .input(
          z
            .object({
              targetUserId: z.number().int().positive(),
              role: z
                .enum([
                  "user",
                  "student",
                  "parent",
                  "teacher",
                  "admin",
                  "super_admin",
                  "support",
                ])
                .optional(),
              accountStatus: z
                .enum([
                  "active",
                  "suspended",
                  "deactivated",
                ])
                .optional(),
              reason: z.string().max(1000).optional(),
            })
            .refine(
              (input) =>
                input.role !== undefined ||
                input.accountStatus !== undefined,
              "يجب تحديد تغيير واحد على الأقل",
            ),
        )
        .mutation(async ({ ctx, input }) => {
          if (ctx.user.id === input.targetUserId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "لا يمكن تعديل صلاحيات الحساب الحالي",
            });
          }

          if (
            input.role === "super_admin" &&
            ctx.user.role !== "super_admin"
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "تعيين super_admin متاح لـsuper_admin فقط",
            });
          }

          const current = await getStudentProfile(
            input.targetUserId,
          );

          if (!current && input.role === "student") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "أنشئ ملف الطالب قبل تعيين الدور",
            });
          }

          const existingBefore = await getUserById(
            input.targetUserId,
          );

          if (!existingBefore) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "المستخدم غير موجود",
            });
          }

          if (
            existingBefore.role === "super_admin" &&
            (
              (input.role !== undefined &&
                input.role !== "super_admin") ||
              (input.accountStatus !== undefined &&
                input.accountStatus !== "active")
            ) &&
            (await countSuperAdmins()) <= 1
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "لا يمكن إزالة آخر super_admin",
            });
          }

          const existing = await updateUserAccessWithAudit(
            input.targetUserId,
            {
              role: input.role,
              accountStatus: input.accountStatus,
            },
            ctx.user.id,
            input.reason,
          );

          if (!existing) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "المستخدم غير موجود",
            });
          }

          return existing.after;
        }),
    }),

    relationships: router({
      setStatus: privilegedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            status: z.enum([
              "pending",
              "active",
              "revoked",
            ]),
            reason: z.string().max(1000).optional(),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          const result =
            await setRelationshipStatusWithAudit(
              input.id,
              input.status,
              ctx.user.id,
              input.reason,
            );

          if (!result) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "العلاقة غير موجودة",
            });
          }
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
