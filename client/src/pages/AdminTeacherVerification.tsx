import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  GraduationCap,
  RefreshCw,
  Eye,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminTeacherVerificationDocuments from "./AdminTeacherVerificationDocuments";

type TeacherStatus = "pending" | "approved" | "rejected";

type Teacher = {
  id: string;
  display_name: string | null;
  bio: string | null;
  qualification: string | null;
  specialization: string | null;
  years_experience: number | null;
  subjects: string[] | null;
  education_stages: string[] | null;
  grades: string[] | null;
  teaching_format: string | null;
  hourly_rate: number | null;
  currency: string | null;
  verification_status: string | null;
  rejection_reason: string | null;
};

const statusLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const REQUIRED_DOCUMENTS = [
  "qualification",
  "identity",
  "teaching_video",
] as const;

export default function AdminTeacherVerification() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("teacher_profiles")
      .select(
        "id,display_name,bio,qualification,specialization,years_experience,subjects,education_stages,grades,teaching_format,hourly_rate,currency,verification_status,rejection_reason"
      );

    if (loadError) {
      setError(
        "تعذر تحميل طلبات المدرسين. تحققي من صلاحيات Supabase وسياسات RLS. التفاصيل: " +
          loadError.message
      );
      setLoading(false);
      return;
    }

    setTeachers((data ?? []) as unknown as Teacher[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  const counts = useMemo(
    () => ({
      all: teachers.length,
      pending: teachers.filter(
        (teacher) => teacher.verification_status === "pending"
      ).length,
      approved: teachers.filter(
        (teacher) => teacher.verification_status === "approved"
      ).length,
      rejected: teachers.filter(
        (teacher) => teacher.verification_status === "rejected"
      ).length,
    }),
    [teachers]
  );

  const filteredTeachers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const searchable = [
        teacher.display_name,
        teacher.qualification,
        teacher.specialization,
        ...(teacher.subjects ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchable.includes(term);
      const matchesFilter =
        filter === "all" || teacher.verification_status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [teachers, search, filter]);

  async function updateStatus(
    teacher: Teacher,
    status: TeacherStatus
  ) {
    if (saving) return;

    if (status === "rejected" && !reason.trim()) {
      setError("اكتبي سبب الرفض قبل تسجيل القرار.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      // لا يُسمح بالاعتماد النهائي قبل قبول المستندات الثلاثة.
      if (status === "approved") {
        const { data: docs, error: docsError } = await supabase
          .from("teacher_verification_documents")
          .select("document_type,status")
          .eq("teacher_id", teacher.id);

        if (docsError) {
          setError(
            "تعذر التحقق من مستندات المعلم. تأكدي من إنشاء جدول المستندات وصلاحيات الإدارة. التفاصيل: " +
              docsError.message
          );
          return;
        }

        const allDocumentsApproved = REQUIRED_DOCUMENTS.every((type) =>
          (docs ?? []).some(
            (doc) =>
              doc.document_type === type && doc.status === "approved"
          )
        );

        if (!allDocumentsApproved) {
          setError(
            "لا يمكن اعتماد المعلم قبل رفع شهادة المؤهل وإثبات الهوية وفيديو الشرح، ثم موافقة الإدارة على كل مستند."
          );
          return;
        }
      }

      const { data, error: updateError } = await supabase
        .from("teacher_profiles")
        .update({
          verification_status: status,
          rejection_reason:
            status === "rejected" ? reason.trim() : null,
        })
        .eq("id", teacher.id)
        .select("id,verification_status,rejection_reason")
        .maybeSingle();

      if (updateError) {
        setError(
          "لم يتم حفظ القرار. تحققي من صلاحيات التحديث وسياسات RLS في Supabase. التفاصيل: " +
            updateError.message
        );
        return;
      }

      if (!data) {
        setError(
          "لم تُرجع قاعدة البيانات سجلًا بعد التحديث. قد تمنع سياسات RLS قراءة السجل أو تعديله."
        );
        return;
      }

      setTeachers((current) =>
        current.map((item) =>
          item.id === teacher.id
            ? {
                ...item,
                verification_status: data.verification_status,
                rejection_reason: data.rejection_reason,
              }
            : item
        )
      );

      setSelected(null);
      setReason("");
      setNotice(
        status === "approved"
          ? "تم اعتماد المعلم بنجاح."
          : "تم تسجيل رفض الطلب."
      );
    } catch (unexpectedError) {
      setError(
        unexpectedError instanceof Error
          ? unexpectedError.message
          : "حدث خطأ غير متوقع أثناء حفظ القرار."
      );
    } finally {
      setSaving(false);
    }
  }

  const cards = [
    {
      label: "إجمالي المدرسين",
      value: counts.all,
      icon: GraduationCap,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "قيد المراجعة",
      value: counts.pending,
      icon: Clock,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
    {
      label: "المدرسون المعتمدون",
      value: counts.approved,
      icon: CheckCircle2,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "طلبات مرفوضة",
      value: counts.rejected,
      icon: XCircle,
      color: "text-red-700",
      bg: "bg-red-50",
    },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 p-4 text-slate-800 md:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck size={18} />
              إدارة المنصة / اعتماد المدرسين
            </p>
            <h1 className="text-2xl font-bold md:text-3xl">
              مراجعة واعتماد المدرسين
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              مراجعة بيانات المدرسين ومستنداتهم وتسجيل قرارات الإدارة.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadTeachers()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-bold hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={17} />
            تحديث البيانات
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-800"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">{card.label}</p>
                    <p className="mt-3 text-3xl font-bold">
                      {loading ? "—" : card.value}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${card.bg} ${card.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold">البحث وتصفية الطلبات</h2>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="relative">
              <Search
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="اسم المدرس أو المادة أو التخصص..."
                className="w-full rounded-xl border p-3 pr-10 outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border bg-white p-3 outline-none focus:border-blue-500"
              aria-label="تصفية حسب حالة الاعتماد"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-bold">طلبات اعتماد المدرسين</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "جارٍ تحميل البيانات..."
                : `عدد النتائج: ${filteredTeachers.length}`}
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              جارٍ تحميل طلبات المدرسين...
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="p-12 text-center">
              <GraduationCap
                size={36}
                className="mx-auto mb-3 text-slate-400"
              />
              <h3 className="font-bold">لا توجد طلبات مطابقة</h3>
              <p className="mt-2 text-sm text-slate-500">
                إذا كنتِ تتوقعين وجود طلبات، تحققي من إرسال طلب المراجعة
                وصلاحيات قراءة الجدول.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-right text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-4">اسم المدرس</th>
                    <th className="p-4">التخصص</th>
                    <th className="p-4">المواد</th>
                    <th className="p-4">الخبرة</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTeachers.map((teacher) => {
                    const status =
                      teacher.verification_status ?? "pending";

                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50">
                        <td className="p-4 font-semibold">
                          {teacher.display_name || "بدون اسم"}
                          <p className="mt-1 text-xs font-normal text-slate-500">
                            {teacher.qualification || "المؤهل غير محدد"}
                          </p>
                        </td>
                        <td className="p-4">
                          {teacher.specialization || "غير محدد"}
                        </td>
                        <td className="p-4">
                          {(teacher.subjects ?? []).join("، ") || "غير محددة"}
                        </td>
                        <td className="p-4">
                          {teacher.years_experience ?? 0} سنة
                        </td>
                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              statusStyles[status] ??
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {statusLabels[status] ?? status}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(teacher);
                              setReason(teacher.rejection_reason ?? "");
                              setError("");
                              setNotice("");
                            }}
                            className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 font-bold text-blue-700 hover:bg-blue-50"
                          >
                            <Eye size={16} />
                            مراجعة
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold">معايير الاعتماد الإدارية</h2>
          <ul className="grid gap-3 text-sm leading-7 sm:grid-cols-2">
            {[
              "التحقق من الهوية وصحة البيانات الشخصية.",
              "مراجعة المؤهل الدراسي والتخصص.",
              "مراجعة شهادة المؤهل وإثبات الهوية وفيديو الشرح.",
              "ملاءمة المواد والمراحل والصفوف.",
              "مراجعة الخبرة والنبذة المهنية.",
              "تسجيل سبب الرفض عند عدم استيفاء الشروط.",
            ].map((item) => (
              <li key={item} className="rounded-xl bg-slate-50 p-3">
                <CheckCircle2
                  size={17}
                  className="ml-2 inline text-blue-700"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setSelected(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-review-title"
            className="my-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="teacher-review-title" className="text-xl font-bold">
                  مراجعة طلب المدرس
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.display_name || "بدون اسم"}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setSelected(null)}
                className="rounded-lg px-3 py-1 text-2xl hover:bg-slate-100 disabled:opacity-50"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">المؤهل</p>
                <p className="mt-1 font-semibold">
                  {selected.qualification || "غير محدد"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">التخصص</p>
                <p className="mt-1 font-semibold">
                  {selected.specialization || "غير محدد"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">المواد</p>
                <p className="mt-1">
                  {(selected.subjects ?? []).join("، ") || "غير محددة"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">المراحل التعليمية</p>
                <p className="mt-1">
                  {(selected.education_stages ?? []).join("، ") ||
                    "غير محددة"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">الصفوف</p>
                <p className="mt-1">
                  {(selected.grades ?? []).join("، ") || "غير محددة"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">سنوات الخبرة</p>
                <p className="mt-1">
                  {selected.years_experience ?? 0} سنة
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <h3 className="mb-2 font-bold">النبذة المهنية</h3>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {selected.bio || "لم يكتب المدرس نبذة مهنية."}
              </p>
            </div>

            {/* قسم مراجعة المستندات الخاصة */}
            <div className="mt-5">
              <AdminTeacherVerificationDocuments
                teacherId={selected.id}
              />
            </div>

            <label className="mt-5 block text-sm font-bold">
              سبب الرفض أو ملاحظات الإدارة
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                disabled={saving}
                placeholder="اكتبي سبب الرفض إذا كان الطلب غير مستوفٍ..."
                className="mt-2 w-full rounded-xl border p-3 font-normal outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </label>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void updateStatus(selected, "approved")}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 size={17} />
                اعتماد المدرس
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void updateStatus(selected, "rejected")}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle size={17} />
                رفض الطلب
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => setSelected(null)}
                className="mr-auto rounded-xl border px-4 py-3 font-bold disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>

            {saving && (
              <p className="mt-4 text-sm text-slate-500">
                جارٍ حفظ القرار...
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
