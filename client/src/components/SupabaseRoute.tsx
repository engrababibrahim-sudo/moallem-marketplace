import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, type AppRole } from "@/context/AuthContext";

export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: AppRole[] }) {
  const { profile, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !profile) navigate("/auth");
  }, [loading, profile, navigate]);

  if (loading || !profile) {
    return <div dir="rtl" className="grid min-h-screen place-items-center bg-[#fbf8f4]"><div className="h-9 w-9 animate-spin rounded-full border-4 border-[#ff7a00]/20 border-t-[#ff7a00]" /></div>;
  }

  if (profile.account_status !== "active") {
    return <div dir="rtl" className="grid min-h-screen place-items-center bg-[#fbf8f4] p-6"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-extrabold">الحساب غير متاح حاليًا</h1><p className="mt-3 text-sm leading-7 text-black/55">حالة الحساب: {profile.account_status === "suspended" ? "موقوف مؤقتًا" : "غير مفعّل"}.</p></div></div>;
  }

  if (roles && !roles.includes(profile.role)) {
    return <div dir="rtl" className="grid min-h-screen place-items-center bg-[#fbf8f4] p-6"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-extrabold">لا تملك صلاحية الوصول</h1><p className="mt-3 text-sm leading-7 text-black/55">هذه المساحة مخصصة لدور مختلف.</p><button onClick={() => navigate("/")} className="mt-6 rounded-full bg-[#182431] px-6 py-3 text-sm font-bold text-white">العودة للرئيسية</button></div></div>;
  }

  return <>{children}</>;
}
