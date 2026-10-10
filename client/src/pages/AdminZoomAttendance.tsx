import { useEffect, useState } from "react";
import { RefreshCw, Video, Users, Clock3, CalendarDays, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Event = { event_type:string; participant_name:string|null; participant_email:string|null; participant_user_id:string|null; event_time:string };
type Session = { booking_id:string; meeting_id:string|null; status:string; scheduled_start_at:string; scheduled_end_at:string; subject:string; booking_status:string; payment_status:string; student:{full_name:string|null;email:string|null}|null; teacher:{full_name:string|null;email:string|null}|null; events:Event[] };
const fmt=(value:string|null|undefined)=>value?new Intl.DateTimeFormat("ar-EG",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Cairo"}).format(new Date(value)):"—";
export default function AdminZoomAttendance(){
 const [sessions,setSessions]=useState<Session[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(){
  setLoading(true);setError("");
  try{
   const {data}=await supabase.auth.getSession(); const token=data.session?.access_token;
   if(!token){setError("انتهت جلسة الدخول. سجّلي الدخول مرة أخرى.");setLoading(false);return;}
   const response=await fetch("/api/admin/zoom-attendance",{headers:{Authorization:"Bearer "+token}});
   const body=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(body?.error||"تعذر تحميل تقرير الحضور.");
   setSessions(body.sessions||[]);
  }catch(e){setError(e instanceof Error?e.message:"تعذر تحميل تقرير الحضور.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[]);
 return <section dir="rtl" className="space-y-6">
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-gradient-to-l from-[#142a57] to-[#254c91] p-6 text-white">
   <div><p className="text-sm font-bold text-blue-200">تقارير اللقاءات</p><h2 className="mt-2 text-2xl font-black">حضور حصص Zoom</h2><p className="mt-2 text-sm text-white/70">تُعرض بيانات الدخول والخروج التي تصل من Zoom، وليس مجرد فتح رابط الحصة.</p></div>
   <button onClick={()=>void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#142a57] disabled:opacity-50"><RefreshCw className={"h-4 w-4 "+(loading?"animate-spin":"")}/> تحديث التقرير</button>
  </div>
  <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0"/><p>يلزم تشغيل ترحيل قاعدة البيانات وإضافة عنوان Webhook في Zoom حتى تبدأ الأحداث في الظهور. اللقاءات السابقة لن تظهر بأثر رجعي تلقائيًا.</p></div>
  {error&&<div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
  {loading?<div className="py-12 text-center text-sm text-slate-500">جارٍ تحميل تقرير الحضور…</div>:error?null:sessions.length===0?<div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">لا توجد لقاءات Zoom مسجلة حتى الآن.</div>:<div className="space-y-4">{sessions.map(s=>{
   const joined=s.events.filter(e=>e.event_type==="meeting.participant_joined"),left=s.events.filter(e=>e.event_type==="meeting.participant_left");
   const studentEvents=s.events.filter(e=>e.participant_email&&e.participant_email===s.student?.email);
   const teacherEvents=s.events.filter(e=>e.participant_email&&e.participant_email===s.teacher?.email);
   return <article key={s.booking_id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{s.subject}</h3><p className="mt-1 text-xs text-slate-500">موعد اللقاء: {fmt(s.scheduled_start_at)} — {fmt(s.scheduled_end_at)}</p><p className="mt-1 text-xs text-slate-400">رقم الحجز: {s.booking_id}</p></div><span className={"rounded-full px-3 py-1.5 text-xs font-bold "+(joined.length>=2?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700")}>{joined.length>=2?"تم تسجيل دخول مشاركين":"الحضور غير مكتمل/غير مؤكد"}</span></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4"/> الطالب</div><p className="mt-2 text-sm">{s.student?.full_name||s.student?.email||"غير معروف"}</p><p className="mt-1 text-xs text-slate-500">{studentEvents.length?"تطابق بريد Zoom مع حساب الطالب":"لم يتطابق بريد Zoom مع بريد حساب الطالب"}</p></div><div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm font-bold"><Video className="h-4 w-4"/> المعلم</div><p className="mt-2 text-sm">{s.teacher?.full_name||s.teacher?.email||"غير معروف"}</p><p className="mt-1 text-xs text-slate-500">{teacherEvents.length?"تطابق بريد Zoom مع حساب المعلم":"لم يتطابق بريد Zoom مع بريد حساب المعلم"}</p></div></div>
    <div className="mt-4"><h4 className="mb-2 text-sm font-extrabold">سجل أحداث Zoom ({s.events.length})</h4>{s.events.length===0?<p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">لم تصل أحداث حضور من Zoom لهذا اللقاء.</p>:<div className="space-y-2">{s.events.map((e,i)=><div key={s.booking_id+"-"+i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2 text-sm"><span>{e.event_type==="meeting.participant_joined"?"دخول": "خروج"} — {e.participant_name||e.participant_email||"مشارك غير معروف"}</span><span className="text-xs text-slate-500">{fmt(e.event_time)}</span></div>)}</div>}</div>
    <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><CalendarDays className="h-3.5 w-3.5"/> {joined.length} دخول · {left.length} خروج · <Clock3 className="h-3.5 w-3.5"/> لا يتم اعتماد الحضور اعتمادًا نهائيًا إلا بعد مطابقة هوية المشاركين.</p>
   </article>
  })}</div>}
 </section>;
}
