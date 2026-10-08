import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, GraduationCap, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "signup";
type SignupRole = "student" | "parent" | "teacher";

const roleLabels: Record<SignupRole, string> = { student: "طالب", parent: "ولي أمر", teacher: "معلم" };

function friendly(message: string) {
  if (/invalid login credentials/i.test(message)) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (/email not confirmed/i.test(message)) return "يرجى تأكيد بريدك الإلكتروني أولًا.";
  if (/user already registered/i.test(message)) return "يوجد حساب بهذا البريد بالفعل.";
  if (/password should be at least/i.test(message)) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل.";
  return message;
}

export default function Auth() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<SignupRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (user && !loading) {
    navigate("/portal");
    return null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        navigate("/portal");
      } else {
        if (!name.trim()) throw new Error("اكتب الاسم بالكامل.");
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim(), requested_role: role }, emailRedirectTo: window.location.origin + "/portal" },
        });
        if (authError) throw authError;
        if (data.session) navigate("/portal");
        else { setMessage("تم إنشاء الحساب. راجع بريدك لتأكيد الحساب ثم سجّل الدخول."); setMode("login"); }
      }
    } catch (e) {
      setError(friendly(e instanceof Error ? e.message : "تعذر إتمام العملية."));
    } finally { setBusy(false); }
  }

  return <div dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
      <Link href="/" className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#182431] text-white"><GraduationCap className="h-5 w-5" /></span><b className="text-xl">مُعلّم</b></Link>
      <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-black/50"><ArrowLeft className="h-4 w-4" /> الرئيسية</Link>
    </header>
    <main className="mx-auto grid max-w-5xl gap-6 px-5 py-8 lg:grid-cols-[.9fr_1.1fr] lg:px-10 lg:py-16">
      <section className="rounded-[2rem] bg-[#182431] p-8 text-white lg:p-10">
        <ShieldCheck className="text-[#ffb36e]" /><h1 className="mt-10 text-4xl font-extrabold leading-tight">تعلم بثقة.<br /><span className="text-[#ffb36e]">واختر معلمك بوضوح.</span></h1>
        <p className="mt-6 leading-8 text-white/65">حساب واحد للوصول إلى المعلمين والحجوزات ومتابعة رحلة التعلم.</p>
        <div className="mt-10 space-y-4 text-sm text-white/75"><p>✓ مصادقة مستقلة عن Manus</p><p>✓ صلاحيات محمية داخل PostgreSQL</p><p>✓ المعلمون يمرون بالمراجعة قبل الظهور</p></div>
      </section>
      <section className="rounded-[2rem] bg-white p-7 shadow-sm lg:p-10">
        <div className="flex gap-6 border-b border-black/10"><button onClick={() => {setMode("login");setError("");}} className={"pb-4 text-sm font-bold " + (mode === "login" ? "border-b-2 border-[#ff7a00] text-[#e76f00]" : "text-black/35")}>تسجيل الدخول</button><button onClick={() => {setMode("signup");setError("");}} className={"pb-4 text-sm font-bold " + (mode === "signup" ? "border-b-2 border-[#ff7a00] text-[#e76f00]" : "text-black/35")}>إنشاء حساب</button></div>
        <h2 className="mt-9 text-2xl font-extrabold">{mode === "login" ? "مرحبًا بعودتك" : "أنشئ حسابك"}</h2>
        <p className="mt-2 text-sm text-black/50">{mode === "login" ? "استخدم بريدك وكلمة المرور للدخول." : "اختر نوع الحساب. الحسابات الإدارية تُمنح من الإدارة فقط."}</p>
        {error && <div role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
        {message && <div role="status" className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</div>}
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "signup" && <><label className="block text-sm font-bold">الاسم الكامل<div className="mt-2 flex items-center rounded-xl bg-[#fbf8f4] px-3"><UserRound className="h-4 w-4 text-black/35" /><input required value={name} onChange={e=>setName(e.target.value)} className="w-full bg-transparent px-3 py-3 outline-none" /></div></label><label className="block text-sm font-bold">نوع الحساب<select value={role} onChange={e=>setRole(e.target.value as SignupRole)} className="mt-2 w-full rounded-xl bg-[#fbf8f4] px-3 py-3 outline-none">{Object.entries(roleLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label></>}
          <label className="block text-sm font-bold">البريد الإلكتروني<div className="mt-2 flex items-center rounded-xl bg-[#fbf8f4] px-3"><Mail className="h-4 w-4 text-black/35" /><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-transparent px-3 py-3 outline-none" /></div></label>
          <label className="block text-sm font-bold">كلمة المرور<div className="mt-2 flex items-center rounded-xl bg-[#fbf8f4] px-3"><LockKeyhole className="h-4 w-4 text-black/35" /><input required minLength={8} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-transparent px-3 py-3 outline-none" /></div></label>
          <button disabled={busy} className="w-full rounded-full bg-[#182431] py-4 font-bold text-white hover:bg-[#ff7a00] disabled:opacity-50">{busy ? "جارٍ التنفيذ..." : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}</button>
        </form>
        <p className="mt-5 text-center text-xs text-black/40">تسجيل آمن عبر Supabase Auth</p>
      </section>
    </main>
  </div>;
}
