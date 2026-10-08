import { Link } from "wouter";
import { LayoutDashboard, Users, GraduationCap, UserRound, ClipboardCheck, CalendarDays, CircleDollarSign, BookOpen, Headphones, FileText, Settings, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

const menu = [
  ["الرئيسية","/admin",LayoutDashboard],
  ["المستخدمون","/admin/users",Users],
  ["الطلاب","/admin/students",GraduationCap],
  ["أولياء الأمور","/admin/parents",UserRound],
  ["طلبات المعلمين","/admin/teachers",ClipboardCheck],
  ["الحجوزات","/admin/bookings",CalendarDays],
  ["المالية والعمولة","/admin/finance",CircleDollarSign],
  ["المحتوى التعليمي","/admin/content",BookOpen],
  ["الدعم","/admin/support",Headphones],
  ["سجل التدقيق","/admin/audit",FileText],
  ["الإعدادات","/admin/settings",Settings],
] as const;

export default function Admin(){
  const {profile,signOut}=useAuth();
  const [open,setOpen]=useState(false);
  const [location]=useLocation();
  if(!profile)return null;
  return <div dir="rtl" className="min-h-screen bg-[#f4f6f8] text-[#17212b]">
    <aside className={`fixed inset-y-0 right-0 z-40 w-[278px] bg-[#111b27] text-white border-l border-white/10 shadow-2xl transition-transform lg:translate-x-0 ${open?"translate-x-0":"translate-x-full"}`}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <Link href="/admin" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#111b27]"><GraduationCap className="h-5 w-5"/></span><div><b>مُعلّم</b><span className="block text-xs text-white/40">نظام الإدارة</span></div></Link>
          <button className="lg:hidden" onClick={()=>setOpen(false)}><X/></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menu.map(([label,href,Icon])=><Link key={href} href={href} onClick={()=>setOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white/60 hover:bg-white/[.06]"><Icon className="h-4 w-4"/>{label}</Link>)}
        </nav>
        <div className="border-t border-white/10 p-4"><p className="text-xs text-black/45">مساحة خاصة</p><p className="truncate text-sm font-bold">{profile.email}</p><button onClick={signOut} className="mt-3 flex w-full justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold"><LogOut className="h-4 w-4"/>خروج</button></div>
      </div>
    </aside>
    {open&&<button className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={()=>setOpen(false)}/>}
    <div className="min-h-screen lg:mr-72">
      <header className="flex h-16 items-center border-b bg-white px-5 lg:px-8"><button className="mr-2 rounded-xl border p-2 lg:hidden" onClick={()=>setOpen(true)}><Menu/></button><div><p className="text-xs font-bold text-[#c55d08]">لوحة الإدارة</p><h1 className="font-extrabold">نظام الإدارة</h1></div></header>
      <main className="mx-auto max-w-[1500px] p-5 lg:p-8">{location === "/admin" ? <Dashboard/> : location === "/admin/teachers" ? <TeacherRequests/> : <Inactive/>}</main>
    </div>
  </div>;
}
function Card({title}:{title:string}){return <div className="rounded-[22px] border border-black/[.045] bg-white p-6 shadow-sm"><p className="text-sm text-black/50">{title}</p><strong className="mt-2 block text-3xl">—</strong><p className="mt-2 text-xs text-black/40">بيانات مباشرة من قاعدة البيانات.</p></div>}

function Dashboard(){
 const [s,setS]=useState({users:0,teachers:0,pending:0,bookings:0});
 useEffect(()=>{Promise.all([
  supabase.from("profiles").select("id",{count:"exact",head:true}),
  supabase.from("teacher_profiles").select("id",{count:"exact",head:true}),
  supabase.from("teacher_profiles").select("id",{count:"exact",head:true}).eq("verification_status","pending"),
  supabase.from("bookings").select("id",{count:"exact",head:true})
 ]).then(([u,t,p,b])=>setS({users:u.count??0,teachers:t.count??0,pending:p.count??0,bookings:b.count??0}));},[]);
 return <><section className="relative overflow-hidden rounded-[28px] bg-[#111b27] p-8 text-white shadow-xl shadow-black/5"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-[11px] font-bold text-white/70">✦ مركز التحكم الرئيسي</div><h2 className="mt-2 text-3xl font-black tracking-tight lg:text-4xl">أهلًا بك في لوحة الإدارة</h2><p className="mt-3 text-sm text-white/60">من هنا تتابع المعلمين والمستخدمين والحجوزات وكل عمليات منصة مُعلّم.</p></section>
 <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["المستخدمون",s.users],["المعلمون",s.teachers],["طلبات المراجعة",s.pending],["الحجوزات",s.bookings]].map(([l,v])=><div key={String(l)} className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-black/50">{l}</p><strong className="mt-2 block text-3xl">{v}</strong><p className="mt-2 text-xs text-black/40">بيانات مباشرة من قاعدة البيانات.</p></div>)}</div>
 <div className="mt-6 rounded-[24px] border border-black/[.045] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-extrabold">طلبات المعلمين</h2></div><span className="rounded-full bg-[#fff0e2] px-3 py-1 text-xs font-bold text-[#c55d08]">{s.pending} قيد المراجعة</span></div><p className="mt-4 text-sm text-black/50">راجع الطلبات واعتمد المعلمين ليظهروا في السوق.</p><Link href="/admin/teachers" className="mt-4 inline-flex rounded-full bg-[#111b27] px-5 py-3 text-sm font-bold text-white">فتح طلبات المعلمين</Link></div></>;
}
function TeacherRequests(){
 const [items,setItems]=useState<any[]>([]); const [selected,setSelected]=useState<any|null>(null); const [reason,setReason]=useState(""); const [busy,setBusy]=useState(false);
 const load=async()=>{const {data}=await supabase.from("teacher_profiles").select("id,display_name,bio,qualification,specialization,years_experience,subjects,education_stages,grades,teaching_format,hourly_rate,currency,rejection_reason,created_at").eq("verification_status","pending").order("created_at",{ascending:true});setItems(data??[]);};
 useEffect(()=>{load();},[]);
 const review=async(status:"approved"|"rejected")=>{if(!selected)return;setBusy(true);const u=await supabase.auth.getUser();const {error}=await supabase.from("teacher_profiles").update({verification_status:status,rejection_reason:status==="rejected"?(reason.trim()||"يرجى استكمال البيانات وإعادة الإرسال."):null,reviewed_by:u.data.user?.id,reviewed_at:new Date().toISOString()}).eq("id",selected.id);setBusy(false);if(!error){setSelected(null);setReason("");load();}};
 return <section className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-xl font-extrabold">طلبات اعتماد المعلمين</h2><p className="mt-1 text-sm text-black/45">راجع الملف قبل ظهوره في سوق المعلمين.</p></div><span className="rounded-full bg-[#fff0e2] px-3 py-1 text-xs font-bold text-[#c55d08]">{items.length} قيد المراجعة</span></div>
 {items.length===0?<p className="mt-6 rounded-2xl bg-[#fbf8f4] p-5 text-sm text-black/50">لا توجد طلبات جديدة حاليًا.</p>:<div className="mt-5 grid gap-3">{items.map(t=><button key={t.id} onClick={()=>{setSelected(t);setReason("");}} className="rounded-2xl border border-black/5 bg-[#fbf8f4] p-4 text-right"><div className="flex items-center justify-between gap-3"><b>{t.display_name||"معلم بدون اسم"}</b><span className="text-xs text-black/45">{t.subjects?.join(" · ")||"لم يحدد المواد"}</span></div><p className="mt-2 text-xs text-black/50">{t.bio||"لا توجد نبذة."}</p></button>)}</div>}
 {selected&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5"><div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[2rem] bg-white p-7"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-[#c55d08]">طلب اعتماد معلم</p><h3 className="mt-1 text-2xl font-extrabold">{selected.display_name||"معلم"}</h3></div><button onClick={()=>setSelected(null)} className="rounded-full bg-black/5 px-3 py-1">إغلاق</button></div>
 <div className="mt-6 grid gap-3 sm:grid-cols-2"><Info label="المؤهل" value={selected.qualification}/><Info label="التخصص" value={selected.specialization}/><Info label="الخبرة" value={selected.years_experience+" سنة"}/><Info label="السعر" value={selected.hourly_rate?(selected.hourly_rate+" "+(selected.currency||"EGP")+" / ساعة"):"غير محدد"}/><Info label="المواد" value={selected.subjects?.join("، ")}/><Info label="المراحل" value={selected.education_stages?.join("، ")}/><Info label="الصفوف" value={selected.grades?.join("، ")}/><Info label="صيغة التدريس" value={selected.teaching_format}/></div>
 <p className="mt-5 rounded-2xl bg-[#fbf8f4] p-4 text-sm leading-7">{selected.bio||"لا توجد نبذة."}</p><textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="ملاحظة للمعلم عند الرفض (اختياري)" className="mt-4 min-h-24 w-full rounded-xl border border-black/10 bg-[#fbf8f4] p-3 text-sm outline-none"/><div className="mt-4 grid gap-3 sm:grid-cols-2"><button disabled={busy} onClick={()=>review("approved")} className="rounded-full bg-emerald-600 py-3 font-bold text-white">اعتماد المعلم</button><button disabled={busy} onClick={()=>review("rejected")} className="rounded-full bg-red-600 py-3 font-bold text-white">رفض الطلب</button></div></div></div>}</section>;
}
function Inactive(){return <section className="rounded-3xl bg-white p-8 shadow-sm"><p className="text-sm font-bold text-[#c55d08]">قسم غير مفعّل</p><h2 className="mt-2 text-2xl font-extrabold">هذا القسم لا يملك حاليًا جداول أو إجراءات تشغيلية مرتبطة به.</h2><p className="mt-3 text-sm leading-7 text-black/55">سنربط هذا القسم ببيانات المنصة في المرحلة التالية.</p><Link href="/admin" className="mt-6 inline-flex rounded-full bg-[#182431] px-5 py-3 text-sm font-bold text-white">العودة إلى لوحة الإدارة</Link></section>}
function Info({label,value}:{label:string;value:any}){return <div className="rounded-xl bg-[#fbf8f4] p-3"><span className="block text-xs text-black/45">{label}</span><b className="mt-1 block">{value||"—"}</b></div>}
