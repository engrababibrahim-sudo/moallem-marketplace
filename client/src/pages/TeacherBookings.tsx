import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, ExternalLink, GraduationCap, LogOut, Video, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Booking = { id:string; student_id:string; subject:string|null; start_at:string; end_at:string; timezone:string; total_price:number|null; currency:string; status:"pending"|"confirmed"|"cancelled"|"completed"|"rejected"; payment_status:string; notes:string|null; meeting_provider:string|null; student?:{full_name:string|null;email:string|null} };
type LiveSession = { id:string; booking_id:string; provider:"zoom"|"google_meet"; join_url:string|null; host_url:string|null; status:string; scheduled_start_at:string; scheduled_end_at:string };
const statusLabel=(s:Booking["status"])=>({pending:"في انتظار التأكيد",confirmed:"مؤكد",cancelled:"ملغي",completed:"مكتمل",rejected:"مرفوض"}[s]);
const dateText=(v:string,tz:string)=>{try{return new Intl.DateTimeFormat("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:tz}).format(new Date(v));}catch{return new Intl.DateTimeFormat("ar-EG",{dateStyle:"full"}).format(new Date(v));}};
const timeText=(v:string,tz:string)=>{try{return new Intl.DateTimeFormat("ar-EG",{hour:"2-digit",minute:"2-digit",timeZone:tz}).format(new Date(v));}catch{return new Intl.DateTimeFormat("ar-EG",{hour:"2-digit",minute:"2-digit"}).format(new Date(v));}};

export default function TeacherBookings(){
 const {profile,signOut}=useAuth(); const [,navigate]=useLocation();
 const [bookings,setBookings]=useState<Booking[]>([]),[sessions,setSessions]=useState<Record<string,LiveSession>>({}),[loading,setLoading]=useState(true),[busyId,setBusyId]=useState<string|null>(null),[sessionBusy,setSessionBusy]=useState<string|null>(null),[message,setMessage]=useState("");
 async function loadBookings(){
  if(!profile)return; setLoading(true);
  const {data,error}=await supabase.from("bookings").select("id,student_id,subject,start_at,end_at,timezone,total_price,currency,status,payment_status,notes,meeting_provider").eq("teacher_id",profile.id).order("start_at",{ascending:true});
  if(error){console.error(error);setMessage("تعذر تحميل طلبات الحجز.");setBookings([]);setLoading(false);return;}
  const rows=(data??[]) as Booking[]; const ids=[...new Set(rows.map(x=>x.student_id))];
  let ps:{id:string;full_name:string|null;email:string|null}[]=[];
  if(ids.length){const r=await supabase.from("profiles").select("id,full_name,email").in("id",ids);ps=(r.data??[]) as typeof ps;}
  const map=new Map(ps.map(x=>[x.id,x])); setBookings(rows.map(x=>({...x,student:map.get(x.student_id)})));
  const bookingIds=rows.map(x=>x.id);
  if(bookingIds.length){
   const r=await supabase.from("live_sessions").select("id,booking_id,provider,join_url,host_url,status,scheduled_start_at,scheduled_end_at").in("booking_id",bookingIds);
   if(!r.error)setSessions(Object.fromEntries(((r.data??[]) as LiveSession[]).map(s=>[s.booking_id,s])));
  }
  setLoading(false);
 }
 useEffect(()=>{if(profile?.role==="teacher")loadBookings();},[profile?.id,profile?.role]);
 async function updateStatus(id:string,status:"confirmed"|"rejected"){setBusyId(id);setMessage("");const {error}=await supabase.from("bookings").update({status}).eq("id",id).eq("teacher_id",profile?.id).eq("status","pending");setBusyId(null);if(error){console.error(error);setMessage(error.message||"تعذر تحديث حالة الحجز.");return;}setMessage(status==="confirmed"?"تم تأكيد الحجز بنجاح.":"تم رفض طلب الحجز.");await loadBookings();}
 async function createZoomSession(b:Booking){
  setSessionBusy(b.id);setMessage("");
  try{
   const {data:{session}}=await supabase.auth.getSession();
   const token=session?.access_token;
   if(!token){setMessage("يجب تسجيل الدخول أولًا.");return;}
   const response=await fetch("/api/live-sessions/create",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({booking_id:b.id,provider:"zoom"})});
   const data=await response.json().catch(()=>null);
   if(!response.ok){setMessage(data?.error||"تعذر إنشاء حصة Zoom.");return;}
   if(data?.session){setSessions(prev=>({...prev,[b.id]:data.session}));setMessage(data.created?"تم إنشاء حصة Zoom للحجز بنجاح.":"الحصة موجودة بالفعل.");}
  }catch(error){console.error(error);setMessage("تعذر الاتصال بخدمة الاجتماعات.");}
  finally{setSessionBusy(null);}
 }
 async function logout(){await signOut();navigate("/");}
 if(!profile)return null;
 return <main dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]"><header className="border-b border-black/5 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-10"><Link href="/portal" className="inline-flex items-center gap-2 text-sm font-bold text-black/55"><ArrowRight className="h-4 w-4"/> العودة للوحة المعلم</Link><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff7a00] text-white"><GraduationCap className="h-5 w-5"/></span><b>مُعلّم</b></Link><button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-bold"><LogOut className="h-4 w-4"/> خروج</button></div></header><section className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12"><div className="rounded-[2rem] bg-[#182431] p-7 text-white lg:p-10"><p className="text-sm font-bold text-[#ffb36e]">مساحة المعلم</p><h1 className="mt-2 text-3xl font-extrabold">طلبات الحجز</h1><p className="mt-3 text-sm leading-7 text-white/60">راجع طلبات الطلاب ثم أكد الحجز أو ارفضه.</p></div>{message&&<div role="status" className="mt-5 rounded-2xl bg-white p-4 text-sm shadow-sm">{message}</div>}{loading?<div className="py-16 text-center text-sm text-black/45">جارٍ تحميل طلبات الحجز...</div>:bookings.length===0?<div className="mt-7 rounded-[2rem] bg-white p-10 text-center shadow-sm"><CalendarDays className="mx-auto h-10 w-10 text-black/20"/><h2 className="mt-4 text-xl font-extrabold">لا توجد حجوزات حتى الآن</h2><p className="mt-2 text-sm text-black/45">عندما يرسل طالب طلب حجز سيظهر هنا.</p></div>:<div className="mt-7 grid gap-4">{bookings.map(b=>{const live=sessions[b.id];return <article key={b.id} className="rounded-[2rem] bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-extrabold">{b.student?.full_name||"طالب"}</h2><span className={"rounded-full px-3 py-1 text-xs font-bold "+(b.status==="pending"?"bg-[#fff0e2] text-[#c55d08]":b.status==="confirmed"?"bg-emerald-50 text-emerald-700":"bg-black/5 text-black/50")}>{statusLabel(b.status)}</span></div><p className="mt-2 text-sm text-black/50">{b.student?.email||""}</p></div>{b.status==="pending"&&<div className="grid gap-2 sm:grid-cols-2"><button disabled={busyId===b.id} onClick={()=>updateStatus(b.id,"confirmed")} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4"/>{busyId===b.id?"جارٍ التحديث...":"قبول الحجز"}</button><button disabled={busyId===b.id} onClick={()=>updateStatus(b.id,"rejected")} className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-extrabold text-white disabled:opacity-50"><XCircle className="h-4 w-4"/>رفض الحجز</button></div>}</div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl bg-[#fbf8f4] p-4"><span className="text-xs text-black/45">المادة</span><b className="mt-1 block">{b.subject||"غير محددة"}</b></div><div className="rounded-2xl bg-[#fbf8f4] p-4"><span className="text-xs text-black/45">التاريخ</span><b className="mt-1 block text-sm">{dateText(b.start_at,b.timezone)}</b></div><div className="rounded-2xl bg-[#fbf8f4] p-4"><span className="text-xs text-black/45">الوقت</span><b className="mt-1 flex items-center gap-1 text-sm"><Clock3 className="h-4 w-4"/>{timeText(b.start_at,b.timezone)} - {timeText(b.end_at,b.timezone)}</b></div><div className="rounded-2xl bg-[#fbf8f4] p-4"><span className="text-xs text-black/45">القيمة</span><b className="mt-1 block">{b.total_price??"—"} {b.currency}</b></div></div>{b.notes&&<p className="mt-4 rounded-2xl bg-[#fbf8f4] p-4 text-sm leading-7 text-black/60"><b>ملاحظة الطالب:</b> {b.notes}</p>}<p className="mt-4 text-xs text-black/35">حالة الدفع: {b.payment_status==="unpaid"?"غير مدفوع حاليًا":b.payment_status}</p>{b.status==="confirmed"&&<div className="mt-5 rounded-2xl border border-black/5 bg-[#fbf8f4] p-4">{live?<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><b className="flex items-center gap-2"><Video className="h-4 w-4"/>حصة Zoom جاهزة</b><p className="mt-1 text-xs text-black/45">الاجتماع مرتبط بهذا الحجز داخل منصة مُعلّم.</p></div>{live.host_url&&<a href={live.host_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#182431] px-5 py-3 text-sm font-extrabold text-white"><ExternalLink className="h-4 w-4"/>دخول كمعلم</a>}</div>:<button disabled={sessionBusy===b.id} onClick={()=>createZoomSession(b)} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2d8cff] px-6 py-3 text-sm font-extrabold text-white disabled:opacity-50"><Video className="h-4 w-4"/>{sessionBusy===b.id?"جارٍ إنشاء الحصة...":"إنشاء حصة Zoom"}</button>}</div>}</article>})}</div>}</section></main>;
}
