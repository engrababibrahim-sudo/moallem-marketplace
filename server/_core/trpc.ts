import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });
export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  if (ctx.user.accountStatus && ctx.user.accountStatus !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "الحساب غير نشط" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
const requireRole = (...roles: string[]) => t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  if (ctx.user.accountStatus && ctx.user.accountStatus !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "الحساب غير نشط" });
  if (!roles.includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);
export const studentProcedure = t.procedure.use(requireRole("student"));
export const parentProcedure = t.procedure.use(requireRole("parent"));
export const teacherProcedure = t.procedure.use(requireRole("teacher"));
export const supportProcedure = t.procedure.use(requireRole("support"));
export const adminProcedure = t.procedure.use(requireRole("admin"));
export const privilegedProcedure = t.procedure.use(requireRole("admin", "super_admin"));
export const superAdminProcedure = t.procedure.use(requireRole("super_admin"));
