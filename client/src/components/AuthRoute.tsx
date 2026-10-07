import { ReactNode, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

export type AppRole = "user" | "student" | "parent" | "teacher" | "admin" | "super_admin" | "support";

const roleHome: Record<AppRole, string> = {
  user: "/student/profile",
  student: "/dashboard/student",
  parent: "/parent/children",
  teacher: "/teacher/dashboard",
  admin: "/admin/teachers",
  super_admin: "/admin/teachers",
  support: "/dashboard/admin",
};

export function getRoleHome(role?: string | null) {
  return roleHome[(role as AppRole) || "user"] || "/";
}

function LoadingScreen({ message = "جارٍ التحقق من الجلسة…" }: { message?: string }) {
  return <div dir="rtl" className="grid min-h-screen place-items-center bg-[#fbf8f4] p-6 text-[#182431]"><div className="rounded-3xl bg-white px-8 py-7 text-center shadow-sm"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#ff7a00]/20 border-t-[#ff7a00]" /><p className="mt-4 text-sm font-semibold">{message}</p></div></div>;
}

function AccessDenied({ actualRole, requiredRoles }: { actualRole: string; requiredRoles: AppRole[] }) {
  const [, navigate] = useLocation();
  return <div dir="rtl" className="grid min-h-screen place-items-center bg-[#fbf8f4] p-6 text-[#182431]"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold">لا يمكن الوصول إلى هذه الصفحة</h1><p className="mt-3 text-sm leading-7 text-[#182431]/60">هذا القسم مخصص لدور مختلف. سيتم إعادتك إلى مساحتك المناسبة.</p><button onClick={() => navigate(getRoleHome(actualRole))} className="mt-6 rounded-full bg-[#ff7a00] px-6 py-3 text-sm font-bold text-white">العودة إلى مساحتي</button><p className="mt-4 text-xs text-[#182431]/40">الدور المطلوب: {requiredRoles.join("، ")}</p></div></div>;
}

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: AppRole[] }) {
  const [location] = useLocation();
  const { user, loading, error } = useAuth();
  const loginStarted = useRef(false);

  useEffect(() => {
    if (loading || user || loginStarted.current) return;
    loginStarted.current = true;
    startLogin(`${location}${window.location.search}`);
  }, [loading, location, user]);

  if (loading) return <LoadingScreen />;
  if (!user) return <LoadingScreen message={error ? "انتهت الجلسة، جارٍ تسجيل الدخول من جديد…" : "جارٍ فتح تسجيل الدخول…"} />;
  if (roles && !roles.includes(user.role as AppRole)) return <AccessDenied actualRole={user.role} requiredRoles={roles} />;
  return <>{children}</>;
}

export function RoleRedirect() {
  const [location, navigate] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user || location !== "/") return;
    let returnTo: string | null = null;
    try {
      const intent = sessionStorage.getItem("nukhba-auth-intent");
      returnTo = intent === "1" ? sessionStorage.getItem("nukhba-auth-return-to") : null;
      sessionStorage.removeItem("nukhba-auth-intent");
      sessionStorage.removeItem("nukhba-auth-return-to");
    } catch {}
    navigate(returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : getRoleHome(user.role));
  }, [location, loading, navigate, user]);

  return null;
}
