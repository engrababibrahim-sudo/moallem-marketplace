import { useEffect, useState } from "react";
import { RefreshCw, Video, Users, Clock3, CalendarDays, ShieldAlert, GitMerge, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Event = { event_type:string; participant_name:string|null; participant_email:string|null; participant_user_id:string|null; event_time:string; provider_meeting_id?:string|null };
type Session = { booking_id:string; meeting_id:string|null; status:string; scheduled_start_at:string; scheduled_end_at:string; subject:string; booking_status:string; payment_status:string; student:{full_name:string|null;email:string|null}|null; teacher:{full_name:string|null;email:string|null}|null; events:Event[]; meeting_count?:number; continuation_count?:number };
const fmt=(value:string|null|undefined)=>value?new Intl.DateTimeFormat("ar-EG",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Cairo"}).format(new Date(value)):"—";
const normalizeEmail=(value:string|null|undefined)=>value?.trim().toLocaleLowerCase()||"";
const identityStatus=(events:Event[],expectedEmail:string|null|undefined,role:"الطالب"|"المعلم")=>{
 const expected=normalizeEmail(expectedEmail);
 if(expected&&events.some(e=>normalizeEmail(e.participant_email)===expected))return "تم تطابق بريد Zoom مع حساب "+role;
 if(!events.some(e=>normalizeEmail(e.participant_email)))return "لم يرسل Zoom بريدًا إلكترونيًا لهذا الدور؛ الهوية غير مؤكدة";
 return "بريد Zoom المسجل لا يطابق بريد الحساب؛ الهوية غير مؤكدة";
};
export default function AdminZoomAttendance(){
 const [sessions,setSessions]=useState<Session[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(){
  setLoading(true);setError("");
  try{
   const {data}=await supabase.auth.getSession(); const token=data.session?.access_token;
   if(!token){setError("انتهت جلسة الدخول. سجّلي الدخول مرة أخرى.");setLoading(false);return;}
   const response=await fetch("/api/admin/zoom-attendance",{headers:{Authorization:"Bearer "+token}});
   const body=await response.json().catch(()=>null);
   if(!response.ok)throw new Error([body?.error,body?.detail].filter(Boolean).join(" — ")||"تعذر تحميل تقرير الحضور.");
   setSessions(body.sessions||[]);
  }catch(e){setError(e instanceof Error?e.message:"تعذر تحميل تقرير الحضور.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[]);
 return <section dir="rtl" className="space-y-6">
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-gradient-to-l from-[#142a57] to-[#254c91] p-6 text-white">
   <div><p className="text-sm font-bold text-blue-200">تقارير اللقاءات</p><h2 className="mt-2 text-2xl font-black">حضور حصص Zoom</h2><p className="mt-2 text-sm text-white/70">كل حجز يظهر مرة واحدة، بما في ذلك اجتماع الاستكمال، مع الاحتفاظ بأحداث كل اجتماع.</p></div>
   <button onClick={()=>void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#142a57] disabled:opacity-50"><RefreshCw className={"h-4 w-4 "+(loading?"animate-spin":"")}/> تحديث التقرير</button>
  </div>
  <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0"/><p>تنبيه مهم: ظهور دخول المعلم وحده لا يثبت حضور الطالب. يُعرض حضور الطالب كمؤكد فقط عند تطابق بريد Zoom مع بريد حساب الطالب؛ أما الأحداث غير المطابقة فتظل ظاهرة للمراجعة ولا تُحتسب إثباتًا للحضور.</p></div>
  {error&&<div role="alert" className="break-words rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
  {loading?<div className="py-12 text-center text-sm text-slate-500">جارٍ تحميل تقرير الحضور…</div>:error?null:sessions.length===0?<div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">لا توجد لقاءات Zoom مسجلة حتى الآن.</div>:<div className="space-y-4">{sessions.map(s=>{
   const joined=s.events.filter(e=>e.event_type==="meeting.participant_joined"),left=s.events.filter(e=>e.event_type==="meeting.participant_left");
   const studentEvents=s.events.filter(e=>normalizeEmail(e.participant_email)&&normalizeEmail(e.participant_email)===normalizeEmail(s.student?.email));
   const teacherEvents=s.events.filter(e=>normalizeEmail(e.participant_email)&&normalizeEmail(e.participant_email)===normalizeEmail(s.teacher?.email));
   const studentVerified=studentEvents.length>0;\n   const teacherVerified=teacherEvents.length>0;\n   const bothIdentitiesMatched=studentVerified&&teacherVerified;\n   const teacherOnlyEvidence=teacherVerified&&!studentVerified;
   return <article key={s.booking_id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{s.subject}</h3><p className="mt-1 text-xs text-slate-500">موعد الحصة الأصلية: {fmt(s.scheduled_start_at)} — {fmt(s.scheduled_end_at)}</p><p className="mt-1 text-xs text-slate-400">رقم الحجز: {s.booking_id}</p></div><span className={"rounded-full px-3 py-1.5 text-xs font-bold "+(bothIdentitiesMatched?"bg-emerald-50 text-emerald-700":teacherOnlyEvidence?"bg-orange-50 text-orange-800":"bg-amber-50 text-amber-700")}>{bothIdentitiesMatched?"تم التحقق من حضور الطالب والمعلم":teacherOnlyEvidence?"سجلات للمعلم فقط — حضور الطالب غير مثبت":studentVerified?"ظهر الطالب — هوية المعلم غير مؤكدة":joined.length===0?"لا توجد أحداث دخول":"أحداث مسجلة — لم يثبت حضور الطالب"}</span></div>
    {teacherOnlyEvidence&&<div className="mt-3 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-3 text-sm leading-6 text-orange-900"><UserX className="mt-0.5 h-4 w-4 shrink-0"/> سجلات Zoom في هذا الحجز تخص المعلم فقط. لا تُحتسب هذه السجلات حضورًا للطالب، ولا تعني وحدها أن الحصة انعقدت.</div>}\n    {studentVerified&&<div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><UserCheck className="h-4 w-4 shrink-0"/> يوجد حدث Zoom ببريد مطابق لحساب الطالب.</div>}\n    {(s.continuation_count||0)>0&&<div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800"><GitMerge className="h-4 w-4 shrink-0"/> حصة واحدة تشمل الاستكمال ({s.meeting_count||2} اجتماعات Zoom) — لا يُنشأ حجز أو دفع إضافي</div>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4"/> الطالب</div><p className="mt-2 text-sm">{s.student?.full_name||s.student?.email||"غير معروف"}</p><p className="mt-1 text-xs text-slate-500">{identityStatus(s.events,s.student?.email,"الطالب")}</p></div><div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm font-bold"><Video className="h-4 w-4"/> المعلم</div><p className="mt-2 text-sm">{s.teacher?.full_name||s.teacher?.email||"غير معروف"}</p><p className="mt-1 text-xs text-slate-500">{identityStatus(s.events,s.teacher?.email,"المعلم")}</p></div></div>
    <div className="mt-4"><h4 className="mb-2 text-sm font-extrabold">سجل أحداث الحصة كلها ({s.events.length})</h4>{s.events.length===0?<p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">لم تصل أحداث حضور من Zoom لهذه الحصة.</p>:<div className="space-y-2">{s.events.map((e,i)=><div key={s.booking_id+"-"+(e.provider_meeting_id||"meeting")+"-"+i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2 text-sm"><span>{e.event_type==="meeting.participant_joined"?"دخول":"خروج"} — {e.participant_name||e.participant_email||"مشارك غير معروف"}</span><span className="text-xs text-slate-500">{fmt(e.event_time)}</span></div>)}</div>}</div>
    <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><CalendarDays className="h-3.5 w-3.5"/> {joined.length} دخول · {left.length} خروج · <Clock3 className="h-3.5 w-3.5"/> تُجمع الأحداث للحصة نفسها؛ لا يُحسب عدد أحداث الدخول والخروج وحده مدة الحضور الفعلية.</p>
   </article>
  })}</div>}
 </section>;
}
