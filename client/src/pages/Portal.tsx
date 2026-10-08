import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { GraduationCap, LogOut, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Teacher = { id:string; full_name:string; bio:string|null; city:string|null; years_experience:number; hourly_rate:number|null; subjects:string[] };

export default function Portal() {
  const { profile, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [teachers,setTeachers]=useState<Teacher[]>([]);
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{ let active=true;
    supabase.from("teacher_profiles")
      .select("id,bio,years_experience,hourly_rate,subjects,profiles!inner(full_name,city)")
      .eq("verification_status","approved").order("created_at",{ascending:false}).limit(24)
      .then(({data})=>{ if(!active)return; setTeachers((data??[]).map((x:any)=>({id:x.id,bio:x.bio,years_experience:x.years_experience,hourly_rate:x.hourly_rate,subjects:x.subjects??[],full_name:x.profiles?.full_name??"معلم",city:x.profiles?.city??null}))); setLoading(false);});
    return()=>{active=false};
  },[]);

  const filtered=useMemo(()=>{const q=query.trim().toLowerCase(); if(!q)return teachers; return teachers.filter(t=>t.full_name.toLowerCase().includes(q)||t.subjects.some(s=>s.toLowerCase().includes(q))||(t.city??"").toLowerCase().includes(q));},[teachers,query]);
  if(!profile)return null;
  const isAdmin=["admin","super_admin","support"].includes(profile.role);

  async function logout(){await signOut();navigate("/");}

  return <div dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
    <header className="sticky top-0 z-20 border-b border-black/[.06] bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10">
      <Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#182431] text-white"><GraduationCap className="h-5 w-5"/></span><b>مُعلّم</b></Link>
      <div className="hidden md:block text-sm text-black/55">{profile.full_name||profile.email}</div>
      <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-bold"><LogOut className="h-4 w-4"/> خروج</button>
    </div></header>
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
      <section className="rounded-[2rem] bg-[#182431] p-7 text-white lg:p-10"><p className="text-sm font-bold text-[#ffb36e]">{isAdmin?"مركز الإدارة":"مساحة التعلم"}</p><h1 className="mt-2 text-3xl font-extrabold">{isAdmin?"لوحة التحكم":"أهلًا "+(profile.full_name||"بك")}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">نسخة مستقلة عن Manus، بصلاحيات قاعدة بيانات حقيقية وحماية RLS.</p></section>
      {isAdmin ? <AdminStats/> : <section className="mt-9"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-[#c55d08]">سوق المعلمين</p><h2 className="mt-1 text-2xl font-extrabold">معلمون معتمدون</h2></div><div className="flex w-full max-w-sm items-center rounded-2xl bg-white px-4 py-3 shadow-sm"><Search className="h-4 w-4 text-black/35"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="الاسم أو المادة أو المدينة" className="w-full bg-transparent px-3 text-sm outline-none"/></div></div>
        {loading?<div className="py-12 text-center text-sm text-black/45">جارٍ تحميل المعلمين...</div>:filtered.length===0?<div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm"><ShieldCheck className="mx-auto h-8 w-8 text-black/20"/><h3 className="mt-4 font-extrabold">لا يوجد معلمون معتمدون بعد</h3></div>:<div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map(t=><TeacherCard key={t.id} teacher={t}/>)}</div>}
      </section>}
    </main>
  </div>;
}

function TeacherCard({teacher}:{teacher:Teacher}){return <article className="rounded-[1.5rem] bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0e2] font-extrabold text-[#c55d08]">{teacher.full_name.split(/\s+/).map(x=>x[0]).slice(0,2).join("")}</span><div><h3 className="font-extrabold">{teacher.full_name}</h3><p className="mt-1 text-xs text-black/50">{teacher.subjects.join(" · ")||"مواد تعليمية"}{teacher.city?" · "+teacher.city:""}</p></div></div><p className="mt-5 min-h-12 text-sm leading-6 text-black/55">{teacher.bio||"معلم معتمد على منصة مُعلّم."}</p><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><span className="rounded-xl bg-[#fbf8f4] p-3"><b>{teacher.years_experience}</b> سنوات خبرة</span><span className="rounded-xl bg-[#fbf8f4] p-3"><b>{teacher.hourly_rate??"—"}</b> ج.م / ساعة</span></div><button className="mt-4 w-full rounded-full bg-[#182431] py-3 text-sm font-bold text-white">عرض الملف والحجز</button></article>}

function AdminStats(){const [stats,setStats]=useState({users:0,teachers:0,pending:0,bookings:0}); useEffect(()=>{Promise.all([supabase.from("profiles").select("id",{count:"exact",head:true}),supabase.from("teacher_profiles").select("id",{count:"exact",head:true}),supabase.from("teacher_profiles").select("id",{count:"exact",head:true}).eq("verification_status","pending"),supabase.from("bookings").select("id",{count:"exact",head:true})]).then(([u,t,p,b])=>setStats({users:u.count??0,teachers:t.count??0,pending:p.count??0,bookings:b.count??0}));},[]);return <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["المستخدمون",stats.users],["المعلمون",stats.teachers],["طلبات المراجعة",stats.pending],["الحجوزات",stats.bookings]].map(([l,v])=><div key={String(l)} className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm text-black/50">{l}</p><strong className="mt-2 block text-3xl">{v}</strong></div>)}<div className="sm:col-span-2 lg:col-span-4 rounded-3xl bg-white p-6 shadow-sm"><h2 className="font-extrabold">حماية المنصة</h2><p className="mt-3 text-sm leading-7 text-black/55">لا يمكن إنشاء حساب إداري من التسجيل، والمعلم لا يظهر قبل الاعتماد، والحساب الموقوف لا يملك صلاحيات العمليات المحمية.</p></div></div>}
