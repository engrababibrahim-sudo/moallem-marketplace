import { useEffect, useState } from "react";
import { Link } from "wouter";
import { MessageCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type TeacherOption = { id: string; display_name: string | null; subjects: string[] | null; education_stages: string[] | null };

type ParentRequestRow = {
  id: string; parent_name: string; country: string; dial_code: string; phone: string;
  stages: string[]; subjects: string[]; notes: string | null; assigned_teacher: string | null; follow_up_notes: string | null; status: "new" | "contacted" | "closed"; created_at: string;
};

export default function ParentRequestsAdmin() {
  const { profile, loading } = useAuth();
  const [rows, setRows] = useState<ParentRequestRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setBusy(true); setError("");
    const { data, error } = await supabase.from("parent_requests").select("*").order("created_at", { ascending: false });
    if (error) setError("تعذر تحميل الطلبات. تأكدي من تطبيق ملف SQL ومن صلاحيات حساب الإدارة.");
    else setRows((data ?? []) as ParentRequestRow[]);
    setBusy(false);
  }
  useEffect(() => {
    if (profile && ["admin", "super_admin", "support"].includes(profile.role)) {
      void load();
      void supabase.from("public_teacher_directory")
        .select("id,display_name,subjects,education_stages")
        .order("display_name", { ascending: true })
        .then(({ data, error }) => {
          if (error) { console.error("تعذر تحميل قائمة المعلمين", error); setTeachers([]); }
          else setTeachers((data ?? []) as TeacherOption[]);
        });
    }
  }, [profile]);

  function whatsappUrl(row: ParentRequestRow) {
    const dial = (row.dial_code || "").replace(/\D/g, "");
    let localPhone = (row.phone || "").replace(/\D/g, "");
    if (dial && localPhone.startsWith("0")) localPhone = localPhone.slice(1);
    const fullPhone = `${dial}${localPhone}`;
    const message = `مرحبًا أ/ ${row.parent_name}، معك فريق منصة مُعلّم التعليمية. وصلنا طلبك بخصوص المرحلة: ${row.stages.join("، ")}، والمادة: ${row.subjects.join("، ")}. يسعدنا مساعدتك في اختيار المعلم المناسب.\n\nهل يمكننا معرفة الصف الدراسي والأوقات المناسبة لك؟`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
  }

  function editFollowUp(id: string, field: "assigned_teacher" | "follow_up_notes", value: string) {
    setRows(old => old.map(row => row.id === id ? { ...row, [field]: value } : row));
  }

  async function saveFollowUp(row: ParentRequestRow) {
    setSavingId(row.id); setError(""); setSuccess("");
    const { error } = await supabase.from("parent_requests").update({
      assigned_teacher: row.assigned_teacher?.trim() || null,
      follow_up_notes: row.follow_up_notes?.trim() || null,
    }).eq("id", row.id);
    if (error) setError("تعذر حفظ بيانات المتابعة. تأكدي من تنفيذ تحديث قاعدة البيانات في Supabase.");
    else setSuccess(`تم حفظ بيانات متابعة طلب ${row.parent_name} بنجاح.`);
    setSavingId(null);
  }

  async function markContactedFromWhatsApp(id: string) {
    const row = rows.find(item => item.id === id);
    if (!row || row.status !== "new") return;
    // Update the status when the admin opens the WhatsApp contact link.
    const { error } = await supabase.from("parent_requests").update({ status: "contacted" }).eq("id", id);
    if (error) {
      setError("تم فتح واتساب، لكن تعذر تحديث حالة الطلب تلقائيًا. حدّثي الحالة يدويًا.");
      return;
    }
    setRows(old => old.map(item => item.id === id ? { ...item, status: "contacted" } : item));
    setSuccess(`تم تحويل طلب ${row.parent_name} إلى «تم التواصل» عند فتح واتساب.`);
  }

  async function changeStatus(id: string, status: ParentRequestRow["status"]) {
    const { error } = await supabase.from("parent_requests").update({ status }).eq("id", id);
    if (error) setError("تعذر تحديث حالة الطلب. راجعي سياسات الصلاحيات في Supabase.");
    else setRows(old => old.map(row => row.id === id ? { ...row, status } : row));
  }

  if (loading) return <main dir="rtl" className="p-8">جارٍ التحقق من الحساب...</main>;
  if (!profile || !["admin", "super_admin", "support"].includes(profile.role)) return <main dir="rtl" className="mx-auto max-w-xl p-8 text-center"><ShieldAlert className="mx-auto mb-3 h-10 w-10" /><h1 className="text-xl font-bold">هذه الصفحة مخصصة لفريق الإدارة</h1><Link href="/" className="mt-4 inline-block text-primary underline">العودة للرئيسية</Link></main>;

  return <main dir="rtl" className="min-h-screen bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><Link href="/admin" className="text-sm text-primary underline">لوحة الإدارة</Link><h1 className="mt-2 text-2xl font-bold">طلبات أولياء الأمور</h1><p className="mt-1 text-sm text-muted-foreground">طلبات المساعدة التعليمية الواردة من الدول المختلفة.</p></div><button onClick={() => void load()} disabled={busy} className="flex items-center gap-2 rounded-xl border px-4 py-2"><RefreshCw className="h-4 w-4" /> تحديث</button></div>
    {success && <p role="status" className="mt-5 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700">{success}</p>}{error && <p role="alert" className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {busy && <p className="py-8 text-center">جارٍ تحميل الطلبات...</p>}
    {!busy && rows.length === 0 && !error && <p className="mt-6 rounded-xl border p-8 text-center text-muted-foreground">لا توجد طلبات حتى الآن.</p>}
    <div className="mt-6 space-y-4">{rows.map(row => <article key={row.id} className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{row.parent_name}</h2><p className="mt-1 text-sm text-muted-foreground">{row.country} · {row.dial_code} {row.phone}</p>
        <a href={whatsappUrl(row)} target="_blank" rel="noreferrer" onClick={() => { if (row.status === "new") void markContactedFromWhatsApp(row.id); }} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 text-sm font-bold text-white hover:bg-[#1fb85a]">
          <MessageCircle className="h-4 w-4" /> التواصل عبر واتساب
        </a><p className="mt-1 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString("ar-EG")}</p></div>
      <select aria-label="حالة الطلب" value={row.status} onChange={e => void changeStatus(row.id, e.target.value as ParentRequestRow["status"])} className="rounded-lg border bg-background px-3 py-2"><option value="new">جديد</option><option value="contacted">تم التواصل</option><option value="closed">مغلق</option></select></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><b className="text-sm">المراحل</b><p className="mt-1 text-sm">{row.stages.join("، ")}</p></div><div><b className="text-sm">المواد</b><p className="mt-1 text-sm">{row.subjects.join("، ")}</p></div></div>
      {row.notes && <p className="mt-4 rounded-xl bg-muted p-3 text-sm leading-6"><b>ملاحظات ولي الأمر:</b> {row.notes}</p>}
      <div className="mt-5 border-t pt-4"><h3 className="font-bold">متابعة الطلب</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">اختيار المعلم المرشح<select value={row.assigned_teacher ?? ""} onChange={e => editFollowUp(row.id, "assigned_teacher", e.target.value)} className="mt-1 w-full rounded-xl border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/30"><option value="">اختاري معلمًا من القائمة</option>{teachers.map(teacher => <option key={teacher.id} value={teacher.display_name || teacher.id}>{teacher.display_name || "معلم بدون اسم"}{teacher.subjects?.length ? ` — ${teacher.subjects.join("، ")}` : ""}</option>)}</select>{teachers.length === 0 && <span className="mt-1 block text-xs font-normal text-muted-foreground">لا توجد ملفات معلمين ظاهرة في الدليل العام حاليًا؛ تأكدي من وجود معلمين معتمدين.</span>}</label><label className="text-sm font-semibold">ملاحظات المتابعة<textarea value={row.follow_up_notes ?? ""} onChange={e => editFollowUp(row.id, "follow_up_notes", e.target.value)} placeholder="مثال: تم التواصل، الصف الدراسي، المواعيد المناسبة..." rows={2} className="mt-1 w-full resize-y rounded-xl border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/30" /></label></div><button onClick={() => void saveFollowUp(row)} disabled={savingId === row.id} className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{savingId === row.id ? "جارٍ الحفظ..." : "حفظ بيانات المتابعة"}</button></div>
    </article>)}</div>
  </div></main>;
}
