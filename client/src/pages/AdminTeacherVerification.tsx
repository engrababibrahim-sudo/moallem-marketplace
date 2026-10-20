
import { useMemo, useState } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  Eye,
  Ban,
  GraduationCap,
  Filter,
} from "lucide-react";

type TeacherStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

type Teacher = {
  id: number;
  name: string;
  email: string;
  subject: string;
  stage: string;
  qualification: string;
  experience: string;
  documentsSubmitted: boolean;
  status: TeacherStatus;
  rejectionReason?: string;
};

const initialTeachers: Teacher[] = [];

const statusLabels: Record<TeacherStatus, string> = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  suspended: "موقوف",
};

const statusStyles: Record<TeacherStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-slate-200 text-slate-700",
};

export default function AdminTeacherVerification() {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | TeacherStatus>("all");
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");

  const counts = useMemo(
    () => ({
      all: teachers.length,
      pending: teachers.filter((t) => t.status === "pending").length,
      approved: teachers.filter((t) => t.status === "approved").length,
      rejected: teachers.filter((t) => t.status === "rejected").length,
      suspended: teachers.filter((t) => t.status === "suspended").length,
    }),
    [teachers]
  );

  const filteredTeachers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchesSearch =
        !term ||
        teacher.name.toLowerCase().includes(term) ||
        teacher.email.toLowerCase().includes(term) ||
        teacher.subject.toLowerCase().includes(term);

      const matchesFilter =
        filter === "all" || teacher.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [teachers, search, filter]);

  function updateStatus(
    teacher: Teacher,
    status: TeacherStatus
  ) {
    if (status === "rejected" && !reason.trim()) {
      setNotice("يرجى كتابة سبب الرفض أولًا.");
      return;
    }

    setTeachers((current) =>
      current.map((item) =>
        item.id === teacher.id
          ? {
              ...item,
              status,
              rejectionReason:
                status === "rejected" ? reason.trim() : undefined,
            }
          : item
      )
    );

    setSelected(null);
    setReason("");
    setNotice(
      "تم تحديث الحالة في واجهة الصفحة فقط. لم تُحفظ في قاعدة البيانات."
    );
  }

  const cards = [
    {
      label: "إجمالي الطلبات",
      value: counts.all,
      icon: FileText,
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
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 p-4 text-slate-800 md:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck size={18} />
              إدارة المنصة / اعتماد المدرسين
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">
              مراجعة واعتماد المدرسين
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              مراجعة المؤهلات والتخصصات والمستندات قبل اعتماد المدرس.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm">
            <GraduationCap className="text-blue-700" size={22} />
            <span>لوحة الإدارة</span>
          </div>
        </header>

        {notice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="font-bold"
              aria-label="إغلاق التنبيه"
            >
              ×
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-3 text-3xl font-bold">
                      {card.value}
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

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Filter size={20} className="text-blue-700" />
            <h2 className="text-lg font-bold">البحث وتصفية الطلبات</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative">
              <Search
                size={19}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث باسم المدرس أو البريد أو المادة..."
                className="w-full rounded-xl border border-slate-200 py-3 pr-10 pl-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as "all" | TeacherStatus)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-500"
              aria-label="تصفية حسب حالة الطلب"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
              <option value="suspended">موقوف</option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold">طلبات اعتماد المدرسين</h2>
            <p className="mt-1 text-sm text-slate-500">
              عدد النتائج: {filteredTeachers.length}
            </p>
          </div>

          {filteredTeachers.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <GraduationCap size={30} className="text-slate-400" />
              </div>
              <h3 className="font-bold">لا توجد طلبات لعرضها</h3>
              <p className="mt-2 text-sm text-slate-500">
                ستظهر طلبات المدرسين هنا عند ربط الصفحة بقاعدة البيانات.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-right text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4">المدرس</th>
                    <th className="px-5 py-4">التخصص والمرحلة</th>
                    <th className="px-5 py-4">المؤهل</th>
                    <th className="px-5 py-4">الخبرة</th>
                    <th className="px-5 py-4">المستندات</th>
                    <th className="px-5 py-4">الحالة</th>
                    <th className="px-5 py-4">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="font-semibold">{teacher.name}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {teacher.email}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>{teacher.subject}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {teacher.stage}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {teacher.qualification || "غير محدد"}
                      </td>
                      <td className="px-5 py-4">
                        {teacher.experience || "غير محددة"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            teacher.documentsSubmitted
                              ? "text-emerald-700"
                              : "text-red-700"
                          }
                        >
                          {teacher.documentsSubmitted
                            ? "مكتملة"
                            : "غير مكتملة"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[teacher.status]}`}
                        >
                          {statusLabels[teacher.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(teacher);
                            setReason("");
                            setNotice("");
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          <Eye size={16} />
                          مراجعة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">معايير الاعتماد الإدارية</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              "التحقق من الهوية وصحة البيانات الشخصية.",
              "مراجعة المؤهل الدراسي والتخصص.",
              "التحقق من المستندات والشهادات المطلوبة.",
              "ملاءمة المادة والمرحلة الدراسية المختارة.",
              "مراجعة الخبرة التدريسية والملف المهني.",
              "تسجيل سبب الرفض عند عدم استيفاء الشروط.",
            ].map((criterion) => (
              <div
                key={criterion}
                className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
              >
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <span className="text-sm leading-6">{criterion}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
            className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="review-title" className="text-xl font-bold">
                  مراجعة طلب المدرس
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg px-3 py-1 text-2xl text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">البريد الإلكتروني</p>
                <p className="mt-1 break-all text-sm font-semibold">
                  {selected.email}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">التخصص</p>
                <p className="mt-1 text-sm font-semibold">
                  {selected.subject}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">المرحلة</p>
                <p className="mt-1 text-sm font-semibold">
                  {selected.stage}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">المؤهل والخبرة</p>
                <p className="mt-1 text-sm font-semibold">
                  {selected.qualification} — {selected.experience}
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-xl border border-slate-200 p-4">
              <p className="mb-2 font-semibold">حالة المستندات</p>
              <p
                className={
                  selected.documentsSubmitted
                    ? "text-sm text-emerald-700"
                    : "text-sm text-red-700"
                }
              >
                {selected.documentsSubmitted
                  ? "تم تسجيل اكتمال المستندات."
                  : "المستندات غير مكتملة؛ تحققي منها قبل الاعتماد."}
              </p>
            </div>

            <label className="mb-2 block text-sm font-semibold">
              سبب الرفض أو ملاحظات الإدارة
            </label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="اكتبي السبب أو الملاحظات هنا..."
              className="mb-5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!selected.documentsSubmitted}
                onClick={() => updateStatus(selected, "approved")}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={17} />
                اعتماد
              </button>

              <button
                type="button"
                onClick={() => updateStatus(selected, "rejected")}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                <XCircle size={17} />
                رفض الطلب
              </button>

              <button
                type="button"
                onClick={() => updateStatus(selected, "suspended")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Ban size={17} />
                إيقاف
              </button>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mr-auto rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                إلغاء
              </button>
            </div>

            <p className="mt-4 text-xs leading-5 text-amber-800">
              تنبيه: هذه الإجراءات تغيّر الحالة داخل الصفحة الحالية فقط.
              يلزم ربطها بالخادم وقاعدة البيانات وتقييدها بصلاحيات الإدارة
              حتى تصبح قرارات فعلية دائمة.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
