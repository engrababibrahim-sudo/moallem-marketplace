import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Clock3, GraduationCap, LogOut, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Booking = { id:string; teacher_id:string; subject:string; start_at:string; end_at:string; timezone:string; total_price:number|null; currency:string; status:string; payment_status:string; notes:string|null; cancellation_reason:string|null };
type Teacher = { id:string; display_name:string|null; country:string|null };

const statuses:Record<string,string>={pending:"في انتظار تأكيد المعلم",confirmed:"مؤكد",cancelled:"ملغي",completed:"مكتمل",rejected:"مرفوض"};
const payments:Record<string,string>={unpaid:"غير مدفوع حاليًا",pending:"الدفع قيد الانتظار",paid:"تم الدفع",failed:"فشل الدفع",refunded:"تم رد المبلغ"};

function dateText(v:string,tz:string){return new Intl.DateTimeFormat("ar-EG",{timeZone:tz||"Africa/Cairo",weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(v));}
function timeText(v:string,tz:string){return new Intl.DateTimeFormat("ar-EG",{timeZone:tz||"Africa/Cairo",hour:"2-digit",minute:"2-digit"}).format(new Date(v));}
function statusClass(s:string){return s==="confirmed"||s==="completed"?"bg-emerald-50 text-emerald-700":s==="rejected"||s==="cancelled"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-700";}

export default function StudentBookings(){
  const {profile,signOut}=useAuth(); const [,navigate]=useLocation();
  const [bookings,setBookings]=useState<Booking[]>([]); const [teachers,setTeachers]=useState<Record<string,Teacher>>({});
  const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [cancelling,setCancelling]=useState<string|null>(null); const [confirming,setConfirming]=useState<string|null>(null);
  useEffect(()=>{if(!profile)return; let active=true;
    (async()=>{setLoading(true); setError("");
      const {data,error:e}=await supabase.from("bookings").select("id,teacher_id,subject,start_at,end_at,timezone,total_price,currency,status,payment_status,notes,cancellation_reason").eq("student_id",profile.id).order("start_at",{ascending:false});
      if(e){if(active){setError("تعذر تحميل الحجوزات حاليًا.");setLoading(false);}return;}
      const rows=(data??[]) as Booking[]; const ids=[...new Set(rows.map(x=>x.teacher_id))]; let map:Record<string,Teacher>={};
      if(ids.length){const {data:td}=await supabase.from("public_teacher_directory").select("id,display_name,country").in("id",ids); map=Object.fromEntries(((td??[]) as Teacher[]).map(x=>[x.id,x]));}
      if(active){setBookings(rows);setTeachers(map);setLoading(false);}
    })(); return()=>{active=false};
  },[profile]);
  if(!profile)return null;
  async function logout(){await signOut();navigate("/");}
  return <div dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
    <header className="sticky top-0 z-20 border-b border-black/[.06] bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 lg:px-10">
      <Link href="/portal" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#182431] text-white"><GraduationCap className="h-5 w-5"/></span><b>مُعلّم</b></Link>
      <div className="flex items-center gap-3"><span className="hidden text-sm text-black/55 sm:block">{profile.full_name||profile.email}</span><button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-bold"><LogOut className="h-4 w-4"/> خروج</button></div>
    </div></header>
    <main className="mx-auto max-w-5xl px-5 py-8 lg:px-10"><Link href="/portal" className="inline-flex items-center gap-2 text-sm font-bold text-black/55"><ArrowRight className="h-4 w-4"/> العودة لمساحة التعلم</Link>
      <section className="mt-5 rounded-[2rem] bg-[#182431] p-7 text-white lg:p-10"><p className="text-sm font-bold text-[#ffb36e]">مساحة التعلم</p><h1 className="mt-2 text-3xl font-extrabold">حجوزاتي</h1><p className="mt-3 text-sm leading-7 text-white/60">جميع حصصك وحالات الحجز والدفع.</p></section>
      {loading?<div className="py-16 text-center text-sm text-black/45">جارٍ تحميل الحجوزات...</div>:error?<div className="mt-6 rounded-3xl bg-white p-8 text-center font-bold text-red-600">{error}</div>:bookings.length===0?<div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm"><CalendarDays className="mx-auto h-10 w-10 text-black/20"/><h2 className="mt-4 text-xl font-extrabold">لا توجد حجوزات بعد</h2><p className="mt-2 text-sm text-black/50">اختر معلمًا معتمدًا وابدأ بحجز أول حصة.</p><Link href="/teachers" className="mt-5 inline-flex rounded-full bg-[#182431] px-6 py-3 text-sm font-bold text-white">تصفح المعلمين</Link></div>:
      <section className="mt-6 grid gap-4">{bookings.map(b=>{const t=teachers[b.teacher_id];return <article key={b.id} className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-extrabold">{t?.display_name||"المعلم"}</h2><span className={"rounded-full px-3 py-1 text-xs font-bold "+statusClass(b.status)}>{statuses[b.status]||b.status}</span></div><p className="mt-2 text-sm text-black/50">{b.subject}{t?.country?" · "+t.country:""}</p></div><div className="rounded-2xl bg-[#fbf8f4] px-5 py-4 text-center"><b className="block text-lg">{b.total_price??"—"} {b.currency}</b><span className="text-xs text-black/45">قيمة الحجز</span></div></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#fbf8f4] p-4"><div className="flex items-center gap-2 text-xs text-black/45"><CalendarDays className="h-4 w-4"/> التاريخ</div><b className="mt-2 block text-sm">{dateText(b.start_at,b.timezone)}</b></div><div className="rounded-2xl bg-[#fbf8f4] p-4"><div className="flex items-center gap-2 text-xs text-black/45"><Clock3 className="h-4 w-4"/> الوقت</div><b className="mt-2 block text-sm">{timeText(b.start_at,b.timezone)} - {timeText(b.end_at,b.timezone)}</b><span className="mt-1 block text-xs text-black/40">{b.timezone}</span></div></div>
        <div className="mt-3 rounded-2xl bg-[#fbf8f4] p-4"><span className="text-xs text-black/45">حالة الدفع</span><b className="mt-1 block text-sm">{payments[b.payment_status]||b.payment_status}</b></div>{b.notes&&<div className="mt-3 rounded-2xl border border-black/5 p-4"><span className="text-xs text-black/45">ملاحظتك</span><p className="mt-1 text-sm leading-6">{b.notes}</p></div>}{b.cancellation_reason&&<div className="mt-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700"><b>سبب الإلغاء:</b> {b.cancellation_reason}</div>}{(b.status==="pending"||b.status==="confirmed")&&<div className="mt-4 flex flex-wrap items-center gap-2">{confirming===b.id?<><span className="text-sm font-bold text-red-700">هل تريدين إلغاء الحجز؟</span><button type="button" disabled={cancelling===b.id} onClick={()=>cancelBooking(b.id)} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{cancelling===b.id?"جاري الإلغاء...":"نعم، إلغاء الحجز"}</button><button type="button" disabled={cancelling===b.id} onClick={()=>setConfirming(null)} className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold">تراجع</button></>:<button type="button" onClick={()=>setConfirming(b.id)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-bold text-red-600"><XCircle className="h-4 w-4"/>إلغاء الحجز</button>}</div>}</article>})}</section>}
    </main>
  </div>;
  async function cancelBooking(id:string){
    setCancelling(id); setError("");
    const {data,error:e}=await supabase.rpc("cancel_student_booking",{p_booking_id:id});
    setCancelling(null);
    setConfirming(null);
    if(e || !data){setError(e?.message||"تعذر إلغاء الحجز. قد يكون قد تغيرت حالته بالفعل.");return;}
    setBookings(current=>current.map(b=>b.id===id?{...b,status:"cancelled",cancellation_reason:"إلغاء بواسطة الطالب"}:b));
  }

  return <div dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
    <header className="sticky top-0 z-20 border-b border-black/[.06] bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 lg:px-10">
      <Link href="/portal" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#182431] text-white"><GraduationCap className="h-5 w-5"/></span><b>مُعلّم</b></Link>
      <div className="flex items-center gap-3"><span className="hidden text-sm text-black/55 sm:block">{profile.full_name||profile.email}</span><button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-bold"><LogOut className="h-4 w-4"/> خروج</button></div>
    </div></header>
    <main className="mx-auto max-w-5xl px-5 py-8 lg:px-10"><Link href="/portal" className="inline-flex items-center gap-2 text-sm font-bold text-black/55"><ArrowRight className="h-4 w-4"/> العودة لمساحة التعلم</Link>
      <section className="mt-5 rounded-[2rem] bg-[#182431] p-7 text-white lg:p-10"><p className="text-sm font-bold text-[#ffb36e]">مساحة التعلم</p><h1 className="mt-2 text-3xl font-extrabold">حجوزاتي</h1><p className="mt-3 text-sm leading-7 text-white/60">جميع حصصك وحالات الحجز والدفع.</p></section>
      {loading?<div className="py-16 text-center text-sm text-black/45">جارٍ تحميل الحجوزات...</div>:error?<div className="mt-6 rounded-3xl bg-white p-8 text-center font-bold text-red-600">{error}</div>:bookings.length===0?<div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm"><CalendarDays className="mx-auto h-10 w-10 text-black/20"/><h2 className="mt-4 text-xl font-extrabold">لا توجد حجوزات بعد</h2><p className="mt-2 text-sm text-black/50">اختر معلمًا معتمدًا وابدأ بحجز أول حصة.</p><Link href="/teachers" className="mt-5 inline-flex rounded-full bg-[#182431] px-6 py-3 text-sm font-bold text-white">تصفح المعلمين</Link></div>:
      <section className="mt-6 grid gap-4">{bookings.map(b=>{const t=teachers[b.teacher_id];return <article key={b.id} className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-extrabold">{t?.display_name||"المعلم"}</h2><span className={"rounded-full px-3 py-1 text-xs font-bold "+statusClass(b.status)}>{statuses[b.status]||b.status}</span></div><p className="mt-2 text-sm text-black/50">{b.subject}{t?.country?" · "+t.country:""}</p></div><div className="rounded-2xl bg-[#fbf8f4] px-5 py-4 text-center"><b className="block text-lg">{b.total_price??"—"} {b.currency}</b><span className="text-xs text-black/45">قيمة الحجز</span></div></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#fbf8f4] p-4"><div className="flex items-center gap-2 text-xs text-black/45"><CalendarDays className="h-4 w-4"/> التاريخ</div><b className="mt-2 block text-sm">{dateText(b.start_at,b.timezone)}</b></div><div className="rounded-2xl bg-[#fbf8f4] p-4"><div className="flex items-center gap-2 text-xs text-black/45"><Clock3 className="h-4 w-4"/> الوقت</div><b className="mt-2 block text-sm">{timeText(b.start_at,b.timezone)} - {timeText(b.end_at,b.timezone)}</b><span className="mt-1 block text-xs text-black/40">{b.timezone}</span></div></div>
        <div className="mt-3 rounded-2xl bg-[#fbf8f4] p-4"><span className="text-xs text-black/45">حالة الدفع</span><b className="mt-1 block text-sm">{payments[b.payment_status]||b.payment_status}</b></div>{b.notes&&<div className="mt-3 rounded-2xl border border-black/5 p-4"><span className="text-xs text-black/45">ملاحظتك</span><p className="mt-1 text-sm leading-6">{b.notes}</p></div>}{b.cancellation_reason&&<div className="mt-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700"><b>سبب الإلغاء:</b> {b.cancellation_reason}</div>}{(b.status==="pending"||b.status==="confirmed")&&<div className="mt-4 flex flex-wrap items-center gap-2">{confirming===b.id?<><span className="text-sm font-bold text-red-700">هل تريدين إلغاء الحجز؟</span><button type="button" disabled={cancelling===b.id} onClick={()=>cancelBooking(b.id)} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{cancelling===b.id?"جاري الإلغاء...":"نعم، إلغاء الحجز"}</button><button type="button" disabled={cancelling===b.id} onClick={()=>setConfirming(null)} className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold">تراجع</button></>:<button type="button" onClick={()=>setConfirming(b.id)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-bold text-red-600"><XCircle className="h-4 w-4"/>إلغاء الحجز</button>}</div>}</article>})}</section>}
    </main>
  </div>;
}