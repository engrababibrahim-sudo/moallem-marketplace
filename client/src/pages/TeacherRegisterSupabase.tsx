
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle2, GraduationCap, Send, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const countries = [
  "مصر", "السعودية", "الإمارات", "الكويت", "قطر", "البحرين", "عُمان",
  "الأردن", "المغرب", "الجزائر", "تونس", "الولايات المتحدة",
  "المملكة المتحدة", "كندا", "أستراليا", "تركيا",
];

const currencies = [
  ["EGP", "جنيه مصري (EGP)"],
  ["SAR", "ريال سعودي (SAR)"],
  ["AED", "درهم إماراتي (AED)"],
  ["KWD", "دينار كويتي (KWD)"],
  ["QAR", "ريال قطري (QAR)"],
  ["BHD", "دينار بحريني (BHD)"],
  ["OMR", "ريال عُماني (OMR)"],
  ["USD", "دولار أمريكي (USD)"],
  ["EUR", "يورو (EUR)"],
  ["GBP", "جنيه إسترليني (GBP)"],
  ["CAD", "دولار كندي (CAD)"],
  ["AUD", "دولار أسترالي (AUD)"],
  ["TRY", "ليرة تركية (TRY)"],
  ["JOD", "دينار أردني (JOD)"],
  ["MAD", "درهم مغربي (MAD)"],
  ["DZD", "دينار جزائري (DZD)"],
  ["TND", "دينار تونسي (TND)"],
] as const;

const fields = [
  ["full_name", "الاسم الكامل"],
  ["phone", "رقم الهاتف"],
  ["city", "المدينة"],
  ["country", "الدولة"],
  ["qualification", "المؤهل"],
  ["specialization", "التخصص"],
  ["subjects", "المواد التي تدرّسها (بفواصل)"],
  ["education_stages", "المراحل التعليمية (بفواصل)"],
  ["grades", "الصفوف (بفواصل)"],
  ["teaching_format", "صيغة التدريس"],
  ["years_experience", "سنوات الخبرة"],
  ["hourly_rate", "السعر بالساعة"],
  ["currency", "العملة"],
] as const;

type TeacherForm = {
  full_name: string;
  phone: string;
  city: string;
  country: string;
  qualification: string;
  specialization: string;
  subjects: string;
  education_stages: string;
  grades: string;
  teaching_format: string;
  years_experience: string;
  hourly_rate: string;
  currency: string;
  bio: string;
};

const initialForm: TeacherForm = {
  full_name: "",
  phone: "",
  city: "",
  country: "مصر",
  qualification: "",
  specialization: "",
  subjects: "",
  education_stages: "",
  grades: "",
  teaching_format: "",
  years_experience: "0",
  hourly_rate: "",
  currency: "EGP",
  bio: "",
};

export default function TeacherRegisterSupabase() {
  const { user, profile, loading } = useAuth();
  const [, navigate] = useLocation();

  const [form, setForm] = useState<TeacherForm>(initialForm);
  const [status, setStatus] = useState<"idle" | "saving" | "submitting">("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [hasTeacherProfile, setHasTeacherProfile] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loadingTeacherProfile, setLoadingTeacherProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (
      profile &&
      profile.role !== "teacher" &&
      !["admin", "super_admin"].includes(profile.role)
    ) {
      setError("هذه الصفحة مخصصة للمعلمين.");
    }
  }, [loading, user, profile, navigate]);

  useEffect(() => {
    if (!user) {
      setLoadingTeacherProfile(false);
      return;
    }

    let cancelled = false;

    const loadTeacherProfile = async () => {
      setLoadingTeacherProfile(true);
      setError("");

      const [{ data: account, error: accountError }, { data: teacher, error: teacherLoadError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("full_name,phone,city,country")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("teacher_profiles")
            .select(
              "display_name,bio,qualification,specialization,years_experience,subjects,education_stages,grades,teaching_format,hourly_rate,currency,verification_status,rejection_reason"
            )
            .eq("id", user.id)
            .maybeSingle(),
        ]);

      if (cancelled) return;

      if (accountError) {
        setError("تعذر تحميل بيانات الحساب. " + accountError.message);
        setLoadingTeacherProfile(false);
        return;
      }

      if (teacherLoadError) {
        setError("تعذر تحميل ملف المعلم. " + teacherLoadError.message);
        setLoadingTeacherProfile(false);
        return;
      }

      if (account) {
        setForm((f) => ({
          ...f,
          full_name: account.full_name ?? teacher?.display_name ?? "",
          phone: account.phone ?? "",
          city: account.city ?? "",
          country: account.country ?? "مصر",
        }));
      }

      if (teacher) {
        setHasTeacherProfile(true);
        setVerificationStatus(teacher.verification_status ?? null);

        setForm((f) => ({
          ...f,
          full_name: account?.full_name ?? teacher.display_name ?? f.full_name,
          currency: teacher.currency ?? "EGP",
          bio: teacher.bio ?? "",
          qualification: teacher.qualification ?? "",
          specialization: teacher.specialization ?? "",
          years_experience: String(teacher.years_experience ?? 0),
          subjects: (teacher.subjects ?? []).join(", "),
          education_stages: (teacher.education_stages ?? []).join(", "),
          grades: (teacher.grades ?? []).join(", "),
          teaching_format: teacher.teaching_format ?? "",
          hourly_rate:
            teacher.hourly_rate == null ? "" : String(teacher.hourly_rate),
        }));

        if (teacher.verification_status === "approved") {
          setMessage("ملفك معتمد ويظهر للطلاب في سوق المعلمين.");
        } else if (teacher.verification_status === "pending") {
          setMessage("ملفك قيد المراجعة. سيظهر للطلاب بعد اعتماد الإدارة.");
        } else if (teacher.verification_status === "rejected") {
          setMessage(
            "يحتاج ملفك إلى تعديل قبل إعادة إرساله للمراجعة." +
              (teacher.rejection_reason
                ? " ملاحظات الإدارة: " + teacher.rejection_reason
                : "")
          );
        }
      } else {
        setHasTeacherProfile(false);
        setVerificationStatus(null);
      }

      setLoadingTeacherProfile(false);
    };

    void loadTeacherProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div
        dir="rtl"
        className="grid min-h-screen place-items-center bg-[#fbf8f4]"
      >
        جارٍ التحميل...
      </div>
    );
  }

  if (!user) return null;

  if (loadingTeacherProfile) {
    return (
      <div
        dir="rtl"
        className="grid min-h-screen place-items-center bg-[#fbf8f4] text-[#182431]"
      >
        جارٍ تحميل بيانات ملفك...
      </div>
    );
  }

  if (error && !hasTeacherProfile) {
    return (
      <div
        dir="rtl"
        className="grid min-h-screen place-items-center bg-[#fbf8f4] p-6"
      >
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-red-600">{error}</p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-[#182431] px-6 py-3 text-sm font-bold text-white"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const buildPayload = () => ({
    id: user.id,
    display_name: form.full_name.trim() || null,
    bio: form.bio.trim() || null,
    qualification: form.qualification.trim() || null,
    specialization: form.specialization.trim() || null,
    years_experience: Math.max(0, Number(form.years_experience) || 0),
    subjects: form.subjects
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    education_stages: form.education_stages
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    grades: form.grades
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    teaching_format: form.teaching_format.trim() || null,
    hourly_rate: form.hourly_rate.trim() ? Number(form.hourly_rate) : null,
    currency: form.currency,
  });

  const saveProfileData = async (): Promise<boolean> => {
    setError("");

    if (!form.full_name.trim()) {
      setError("يرجى إدخال الاسم الكامل.");
      return false;
    }

    if (!form.qualification.trim()) {
      setError("يرجى إدخال المؤهل الدراسي.");
      return false;
    }

    if (!form.subjects.trim()) {
      setError("يرجى إدخال مادة واحدة على الأقل.");
      return false;
    }

    if (!form.bio.trim()) {
      setError("يرجى كتابة نبذة مهنية عنك.");
      return false;
    }

    const rate = form.hourly_rate.trim()
      ? Number(form.hourly_rate)
      : null;

    if (rate !== null && (!Number.isFinite(rate) || rate < 0)) {
      setError("يرجى إدخال سعر صحيح وغير سالب.");
      return false;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
      })
      .eq("id", user.id);

    if (profileError) {
      setError("تعذر حفظ بيانات الحساب: " + profileError.message);
      return false;
    }

    const { error: teacherError } = await supabase
      .from("teacher_profiles")
      .upsert(buildPayload());

    if (teacherError) {
      setError("تعذر حفظ ملف المعلم: " + teacherError.message);
      return false;
    }

    setHasTeacherProfile(true);
    return true;
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();

    if (status !== "idle") return;

    setMessage("");
    setError("");
    setStatus("saving");

    try {
      const saved = await saveProfileData();

      if (!saved) return;

      setMessage("تم حفظ الملف بنجاح.");
      setEditMode(false);
    } catch (err) {
      console.error("Teacher profile save failed:", err);
      setError("حدث خطأ غير متوقع أثناء حفظ الملف. يرجى المحاولة مرة أخرى.");
    } finally {
      setStatus("idle");
    }
  };

  const submit = async () => {
    if (status !== "idle") return;

    setMessage("");
    setError("");
    setStatus("submitting");

    try {
      // احفظ آخر التعديلات أولًا، ولا ترسل الطلب إذا فشل الحفظ.
      const saved = await saveProfileData();

      if (!saved) return;

      // لا نغيّر حالة الاعتماد إلا بعد نجاح حفظ البيانات.
      const { data: updatedTeacher, error: submitError } = await supabase
        .from("teacher_profiles")
        .update({
          verification_status: "pending",
          rejection_reason: null,
        })
        .eq("id", user.id)
        .select("id")
        .maybeSingle();

      if (submitError) {
        setError(
          "تم حفظ بياناتك، لكن تعذر إرسال الطلب للمراجعة. " +
            submitError.message
        );
        return;
      }

      if (!updatedTeacher) {
        setError(
          "تم حفظ البيانات، لكن لم يتم إرسال الطلب. " +
            "تحققي من صلاحيات حسابك وسياسات قاعدة البيانات."
        );
        return;
      }

      setVerificationStatus("pending");
      setHasTeacherProfile(true);
      setMessage(
        "تم حفظ بياناتك وإرسال طلبك للمراجعة بنجاح. سيظهر ملفك للطلاب بعد اعتماد الإدارة."
      );
      setEditMode(false);
    } catch (err) {
      console.error("Teacher application submission failed:", err);
      setError(
        "حدث خطأ غير متوقع أثناء إرسال الطلب. يرجى المحاولة مرة أخرى."
      );
    } finally {
      setStatus("idle");
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#182431] text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <b>مُعلّم</b>
          </Link>

          <Link href="/portal" className="text-sm font-bold text-black/50">
            لوحة التحكم
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-8 lg:py-12">
        {hasTeacherProfile &&
        verificationStatus === "approved" &&
        !editMode ? (
          <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm lg:p-12">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
            </span>

            <p className="mt-5 text-sm font-bold text-emerald-700">
              ملف معتمد
            </p>

            <h1 className="mt-2 text-3xl font-extrabold">
              أهلًا {form.full_name || "بك"}
            </h1>

            <p className="mx-auto mt-3 max-w-xl leading-8 text-black/60">
              ملفك كمعلم معتمد ومتاح للطلاب في سوق المعلمين. يمكنك الانتقال إلى
              لوحة التحكم لإدارة حجوزاتك ومواعيدك، أو تعديل بيانات ملفك عند
              الحاجة.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/portal"
                className="rounded-full bg-[#182431] px-7 py-3.5 font-bold text-white"
              >
                لوحة المعلم
              </Link>

              <Link
                href="/teacher/bookings"
                className="rounded-full border border-black/10 px-7 py-3.5 font-bold"
              >
                الحجوزات
              </Link>

              <button
                type="button"
                onClick={() => {
                  setEditMode(true);
                  setMessage("يمكنك تعديل بياناتك ثم حفظ التغييرات.");
                  setError("");
                }}
                className="rounded-full bg-[#ff7a00] px-7 py-3.5 font-bold text-white"
              >
                تعديل الملف
              </button>
            </div>
          </section>
        ) : (
          <>
            <div className="rounded-[2rem] bg-[#182431] p-7 text-white lg:p-10">
              <ShieldCheck className="text-[#ffb36e]" />

              <h1 className="mt-4 text-3xl font-extrabold">
                {hasTeacherProfile
                  ? "تحديث ملفك كمعلم"
                  : "أنشئ ملفك كمعلم"}
              </h1>

              <p className="mt-3 text-sm leading-7 text-white/65">
                {hasTeacherProfile
                  ? "بياناتك المحفوظة محمّلة هنا. عدّل ما تحتاج إليه ثم احفظ التغييرات."
                  : "أكمل بياناتك ثم أرسل الطلب للمراجعة. لن يظهر ملفك للطلاب قبل الاعتماد."}
              </p>
            </div>

            {message && (
              <div
                role="status"
                className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700"
              >
                <CheckCircle2 className="ml-2 inline h-4 w-4" />
                {message}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={save}
              className="mt-6 rounded-[2rem] bg-white p-7 shadow-sm lg:p-10"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map(([key, label]) => (
                  <label key={key} className="text-sm font-bold">
                    {label}

                    {key === "country" ? (
                      <select
                        value={form.country}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            country: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbf8f4] p-3 font-normal outline-none focus:border-[#ff7a00]"
                      >
                        {countries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    ) : key === "currency" ? (
                      <select
                        value={form.currency}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            currency: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbf8f4] p-3 font-normal outline-none focus:border-[#ff7a00]"
                      >
                        {currencies.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required={["full_name", "qualification", "subjects"].includes(
                          key
                        )}
                        type={
                          key === "years_experience" || key === "hourly_rate"
                            ? "number"
                            : "text"
                        }
                        min={
                          key === "years_experience" || key === "hourly_rate"
                            ? "0"
                            : undefined
                        }
                        step={key === "hourly_rate" ? "0.01" : undefined}
                        value={form[key as keyof TeacherForm]}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            [key]: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#fbf8f4] p-3 font-normal outline-none focus:border-[#ff7a00]"
                      />
                    )}
                  </label>
                ))}
              </div>

              <label className="mt-4 block text-sm font-bold">
                نبذة مهنية

                <textarea
                  required
                  value={form.bio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  className="mt-2 min-h-32 w-full rounded-xl border border-black/10 bg-[#fbf8f4] p-3 font-normal outline-none focus:border-[#ff7a00]"
                />
              </label>

              <button
                type="submit"
                disabled={status !== "idle"}
                className="mt-6 w-full rounded-full bg-[#182431] py-4 font-bold text-white disabled:opacity-50"
              >
                {status === "saving" ? "جارٍ الحفظ..." : "حفظ الملف"}
              </button>

              <button
                type="button"
                onClick={submit}
                disabled={status !== "idle"}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#ff7a00] py-4 font-bold text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {status === "submitting"
                  ? "جارٍ حفظ البيانات وإرسال الطلب..."
                  : "إرسال للمراجعة"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

