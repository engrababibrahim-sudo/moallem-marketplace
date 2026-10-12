import { useEffect, useState } from "react";
import { Link } from "wouter";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type ParentRequestRow = {
  id: string; parent_name: string; country: string; dial_code: string; phone: string;
  stages: string[]; subjects: string[]; notes: string | null; status: "new" | "contacted" | "closed"; created_at: string;
};

export default function ParentRequestsAdmin() {
  const { profile, loading } = useAuth();
  const [rows, setRows] = useState<ParentRequestRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setBusy(true); setError("");
    const { data, error } = await supabase.from("parent_requests").select("*").order("created_at", { ascending: false });
    if (error) setError("تعذر تحميل الطلبات. تأكدي من تطبيق ملف SQL ومن صلاحيات حساب الإدارة.");
    else setRows((data ?? []) as ParentRequestRow[]);
    setBusy(false);
  }
  useEffect(() => { if (profile && ["admin", "super_admin", "support"].includes(profile.role)) void load(); }, [profile]);

  async function changeStatus(id: string, status: ParentRequestRow["status"]) {
    const { error } = await supabase.from("parent_requests").update({ status }).eq("id", id);
    if (error) setError("تعذر تحديث حالة الطلب. راجعي سياسات الصلاحيات في Supabase.");
    else setRows(old => old.map(row => row.id === id ? { ...row, status } : row));
  }

  if (loading) return <main dir="rtl" className="p-8">جارٍ التحقق من الحساب...</main>;
  if (!profile || !["admin", "super_admin", "support"].includes(profile.role)) return <main dir="rtl" className="mx-auto max-w-xl p-8 text-center"><ShieldAlert className="mx-auto mb-3 h-10 w-10" /><h1 className="text-xl font-bold">هذه الصفحة مخصصة لفريق الإدارة</h1><Link href="/" className="mt-4 inline-block text-primary underline">العودة للرئيسية</Link></main>;

  return <main dir="rtl" className="min-h-screen bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><Link href="/admin" className="text-sm text-primary underline">لوحة الإدارة</Link><h1 className="mt-2 text-2xl font-bold">طلبات أولياء الأمور</h1><p className="mt-1 text-sm text-muted-foreground">طلبات المساعدة التعليمية الواردة من الدول المختلفة.</p></div><button onClick={() => void load()} disabled={busy} className="flex items-center gap-2 rounded-xl border px-4 py-2"><RefreshCw className="h-4 w-4" /> تحديث</button></div>
    {error && <p role="alert" className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {busy && <p className="py-8 text-center">جارٍ تحميل الطلبات...</p>}
    {!busy && rows.length === 0 && !error && <p className="mt-6 rounded-xl border p-8 text-center text-muted-foreground">لا توجد طلبات حتى الآن.</p>}
    <div className="mt-6 space-y-4">{rows.map(row => <article key={row.id} className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{row.parent_name}</h2><p className="mt-1 text-sm text-muted-foreground">{row.country} · {row.dial_code} {row.phone}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString("ar-EG")}</p></div>
      <select aria-label="حالة الطلب" value={row.status} onChange={e => void changeStatus(row.id, e.target.value as ParentRequestRow["status"])} className="rounded-lg border bg-background px-3 py-2"><option value="new">جديد</option><option value="contacted">تم التواصل</option><option value="closed">مغلق</option></select></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><b className="text-sm">المراحل</b><p className="mt-1 text-sm">{row.stages.join("، ")}</p></div><div><b className="text-sm">المواد</b><p className="mt-1 text-sm">{row.subjects.join("، ")}</p></div></div>
      {row.notes && <p className="mt-4 rounded-xl bg-muted p-3 text-sm leading-6">{row.notes}</p>}
    </article>)}</div>
  </div></main>;
}
