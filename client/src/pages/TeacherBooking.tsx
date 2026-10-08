import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, GraduationCap } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Teacher={id:string;display_name:string|null;hourly_rate:number|null;currency:string;subjects:string[]};
type Availability={id:string;day_of_week:number|null;specific_date:string|null;start_time:string;end_time:string;timezone:string};
type Slot=Availability&{date:string;start:string;end:string};

export default function TeacherBooking(){
  const [,params]=useRoute("/teachers/:id/book"); const [,navigate]=useLocation(); const {profile}=useAuth();
  const teacherId=params?.id||""; const [teacher,setTeacher]=useState<Teacher|null>(null); const [availability,setAvailability]=useState<Availability[]>([]);
  const [selected,setSelected]=useState<Slot|null>(null); const [subject,setSubject]=useState(""); const [notes,setNotes]=useState("");
  const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");

  useEffect(()=>{if(!teacherId)return;let active=true;
    Promise.all([
      supabase.from("public_teacher_directory").select("id,display_name,hourly_rate,currency,subjects").eq("id",teacherId).maybeSingle(),
      supabase.from("teacher_availability").select("id,day_of_week,specific_date,start_time,end_time,timezone").eq("teacher_id",teacherId).eq("status","active").order("specific_date",{ascending:true})
    ]).then(([t,a])=>{if(!active)return;if(t.error||!t.data)setMessage("تعذر تحميل بيانات المعلم.");else setTeacher(t.data as Teacher);if(a.error){console.error(a.error);setMessage("تعذر تحميل المواعيد المتاحة.");}else setAvailability((a.data??[]) as Availability[]);setLoading(false);});
    return()=>{active=false};
  },[teacherId]);

  const slots=useMemo(()=>{const out:Slot[]=[];const today=new Date();
    for(let offset=0;offset<21;offset++){const d=new Date(today);d.setHours(0,0,0,0);d.setDate(today.getDate()+offset);const date=d.toISOString().slice(0,10);const day=d.getDay();
      availability.filter(x=>(x.specific_date===date)||(!x.specific_date&&x.day_of_week===day)).forEach(x=>{let cur=Number(x.start_time.slice(0,2))*60+Number(x.start_time.slice(3,5));const end=Number(x.end_time.slice(0,2))*60+Number(x.end_time.slice(3,5));while(cur+60<=end){const next=cur+60;out.push({...x,date,start:String(Math.floor(cur/60)).padStart(2,"0")+":"+String(cur%60).padStart(2,"0"),end:String(Math.floor(next/60)).padStart(2,"0")+":"+String(next%60).padStart(2,"0")});cur=next;}});}
    return out;
  },[availability]);

  async function createBooking(){if(!profile){navigate("/auth");return;}if(profile.role!=="student"||profile.account_status!=="active"){setMessage("الحجز متاح للطالب النشط فقط.");return;}if(!teacher||!selected){setMessage("اختاري موعدًا أولًا.");return;}
    setBusy(true);setMessage("");const start=new Date(selected.date+"T"+selected.start+":00");const end=new Date(selected.date+"T"+selected.end+":00");
    const {error}=await supabase.from("bookings").insert({student_id:profile.id,teacher_id:teacher.id,subject:subject||teacher.subjects?.[0]||null,start_at:start.toISOString(),end_at:end.toISOString(),timezone:selected.timezone||"Africa/Cairo",hourly_rate_snapshot:teacher.hourly_rate,total_price:Number(teacher.hourly_rate??0),currency:teacher.currency,status:"pending",payment_status:"unpaid",notes:notes.trim()||null});
    setBusy(false);if(error){console.error(error);setMessage(error.code==="23P01"?"هذا الموعد تم حجزه بالفعل. اختاري موعدًا آخر.":error.message||"تعذر إنشاء الحجز.");}else{setMessage("تم إرسال طلب الحجز بنجاح. الحالة: في انتظار التأكيد.");setSelected(null);}
  }

  if(loading)return <main dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]"><div className="mx-auto max-w-5xl px-5 py-16 text-center">جارٍ تحميل مواعيد المعلم...</div></main>;
  return <main dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
    <header className="border-b border-black/5 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-10"><Link href={"/teachers/"+teacherId} className="inline-flex items-center gap-2 text-sm font-bold text-black/55"><ArrowRight className="h-4 w-4"/> العودة لملف المعلم</Link><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff7a00] text-white"><GraduationCap className="h-5 w-5"/></span><b>مُعلّم</b></Link></div></header>
    <section className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12"><div className="grid gap-6 lg:grid-cols-[1fr_330px]">
      <section className="rounded-[2rem] bg-white p-6 shadow-sm lg:p-8"><p className="text-sm font-bold text-[#c55d08]">حجز درس</p><h1 className="mt-2 text-3xl font-extrabold">{teacher?.display_name||"المعلم"}</h1><p className="mt-2 text-sm text-black/50">{teacher?.subjects?.join(" · ")||"مواد تعليمية"}</p>
      <div className="mt-8 flex items-center gap-2 text-sm font-bold"><CalendarDays className="h-5 w-5 text-[#ff7a00]"/> المواعيد المتاحة خلال 21 يومًا</div>
      {slots.length===0?<div className="mt-5 rounded-2xl bg-[#fbf8f4] p-6 text-sm leading-7 text-black/55">لا توجد مواعيد متاحة لهذا المعلم حاليًا. يجب على المعلم إضافة أوقات التوفر أولًا.</div>:<div className="mt-5 grid gap-3 sm:grid-cols-2">{slots.map(s=>{const active=selected?.id===s.id&&selected.date===s.date&&selected.start===s.start;return <button type="button" key={s.id+s.date+s.start} onClick={()=>setSelected(s)} className={"rounded-2xl border p-4 text-right "+(active?"border-[#ff7a00] bg-[#fff0e2]":"border-black/5 bg-[#fbf8f4] hover:border-[#ff7a00]/40")}><b className="block">{new Intl.DateTimeFormat("ar-EG",{weekday:"long",day:"numeric",month:"long"}).format(new Date(s.date+"T00:00:00"))}</b><span className="mt-2 inline-flex items-center gap-2 text-sm text-black/55"><Clock3 className="h-4 w-4"/>{s.start} - {s.end}</span><span className="mt-2 block text-[11px] text-black/35">{s.timezone}</span></button>})}</div>}
      {selected&&<div className="mt-7 rounded-3xl bg-[#fff0e2] p-5"><div className="flex items-center gap-2 font-extrabold"><CheckCircle2 className="h-5 w-5 text-[#e96e00]"/> الموعد المختار</div><p className="mt-2 text-sm">{selected.date} · {selected.start} - {selected.end}</p><label className="mt-5 block"><span className="text-xs font-bold text-black/50">المادة</span><select value={subject} onChange={e=>setSubject(e.target.value)} className="mt-2 w-full rounded-xl bg-white p-3 text-sm outline-none"><option value="">اختيار المادة</option>{(teacher?.subjects||[]).map(x=><option key={x}>{x}</option>)}</select></label><label className="mt-4 block"><span className="text-xs font-bold text-black/50">ملاحظة للمعلم</span><textarea value={notes} onChange={e=>setNotes(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl bg-white p-3 text-sm outline-none" placeholder="مثال: أحتاج مراجعة درس..."/></label><button type="button" disabled={busy} onClick={createBooking} className="mt-5 w-full rounded-full bg-[#ff7a00] py-3.5 text-sm font-extrabold text-white disabled:opacity-50">{busy?"جارٍ إنشاء الحجز...":"تأكيد طلب الحجز"}</button></div>}
      {message&&<p role="status" className="mt-5 rounded-2xl bg-[#fbf8f4] p-4 text-sm leading-6">{message}</p>}</section>
      <aside className="rounded-[2rem] bg-[#182431] p-6 text-white"><p className="text-sm text-white/55">السعر بالساعة</p><p className="mt-2 text-3xl font-extrabold">{teacher?.hourly_rate??"—"} <span className="text-base">{teacher?.currency}</span></p><div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm leading-7 text-white/65">سيتم إنشاء الطلب بحالة <b className="text-white">pending</b> ودون خصم مالي في هذه المرحلة.</div><Link href={"/teachers/"+teacherId} className="mt-5 block rounded-full border border-white/15 py-3 text-center text-sm font-bold">مراجعة الملف</Link></aside>
    </div></section></main>;
}
