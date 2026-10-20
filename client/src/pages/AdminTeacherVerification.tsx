
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  BookOpen,
  Clock3,
  GraduationCap,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type VerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

type Teacher = {
  id: number;
  fullName: string;
  qualification: string;
  specialization: string;
  yearsOfExperience: number;
  subjects: string[];
  educationStages: string[];
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
};

// بيانات تجريبية للعرض فقط.
// لا تمثل بيانات المدرسين الحقيقية في قاعدة البيانات.
const demoTeachers: Teacher[] = [];

const statusLabels: Record<VerificationStatus, string> = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  suspended: "موقوف",
};

const statusClasses: Record<VerificationStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-slate-200 text-slate-700",
};

export default function AdminTeacherVerification() {
  const [teachers] = useState<Teacher[]>(demoTeachers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<VerificationStatus | "all">("all");

  const filteredTeachers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchesSearch =
        !term ||
        teacher.fullName.toLowerCase().includes(term) ||
        teacher.specialization.toLowerCase().includes(term) ||
        teacher.qualification.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        teacher.verificationStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [teachers, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: teachers.length,
      pending: teachers.filter(
        (t) => t.verificationStatus === "pending"
      ).length,
      approved: teachers.filter(
        (t) => t.verificationStatus === "approved"
      ).length,
      rejected: teachers.filter(
        (t) => t.verificationStatus === "rejected"
      ).length,
      suspended: teachers.filter(
        (t) => t.verificationStatus === "suspended"
      ).length,
    };
  }, [teachers]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 p-4 md:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3">
              <ShieldCheck
                className="h-7 w-7 text-emerald-700"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                اعتماد المدرسين
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                مراجعة بيانات المدرسين وحالات التحقق قبل
                إظهارهم للطلاب.
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {(
            [
              ["all", "كل المدرسين", BookOpen],
              ["pending", "قيد المراجعة", Clock3],
              ["approved", "معتمدون", BadgeCheck],
              ["rejected", "مرفوضون", XCircle],
              ["suspended", "موقوفون", ShieldCheck],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`rounded-xl border bg-white p-4 text-right shadow-sm transition hover:border-emerald-400 ${
                statusFilter === key
                  ? "border-emerald-500 ring-1 ring-emerald-500"
                  : "border-slate-200"
              }`}
            >
              <Icon className="mb-3 h-5 w-5 text-emerald-700" />
              <div className="text-sm text-slate-600">
                {label}
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {counts[key]}
              </div>
            </button>
          ))}
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          هذه الصفحة تعرض بيانات تجريبية فارغة حاليًا.
          لم يتم ربطها بقاعدة البيانات، ولا تنفذ اعتمادًا أو
          رفضًا حقيقيًا.
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث باسم المدرس أو المؤهل أو التخصص..."
                className="w-full rounded-lg border border-slate-300 py-3 pl-3 pr-10 outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | VerificationStatus
                    | "all"
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-3"
            >
              <option value="all">كل الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
              <option value="suspended">موقوف</option>
            </select>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[700px] text-right">
              <thead>
                <tr className="border-b bg-slate-50 text-sm text-slate-600">
                  <th className="p-3">المدرس</th>
                  <th className="p-3">التخصص</th>
                  <th className="p-3">المؤهل</th>
                  <th className="p-3">الخبرة</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>

              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="border-b last:border-0"
                  >
                    <td className="p-3 font-semibold">
                      {teacher.fullName}
                      <div className="mt-1 text-xs text-slate-500">
                        {teacher.educationStages.join("، ")}
                      </div>
                    </td>

                    <td className="p-3">
                      {teacher.specialization}
                      <div className="mt-1 text-xs text-slate-500">
                        {teacher.subjects.join("، ")}
                      </div>
                    </td>

                    <td className="p-3">
                      {teacher.qualification || "غير محدد"}
                    </td>

                    <td className="p-3">
                      {teacher.yearsOfExperience} سنة
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[teacher.verificationStatus]}`}
                      >
                        {statusLabels[teacher.verificationStatus]}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredTeachers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center text-slate-500"
                    >
                      لا توجد بيانات للعرض. ستظهر طلبات
                      المدرسين بعد ربط الصفحة بقاعدة البيانات.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
