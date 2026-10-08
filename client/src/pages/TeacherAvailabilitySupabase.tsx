import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CalendarDays, Plus, Clock3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const days=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

export default function TeacherAvailabilitySupabase(){
  const {profile}=useAuth();
  const [rows,setRows]=useState<any[]>([]);
  const [day,setDay]=useState("0");
  const [date,setDate]=useState("");
  const [start,setStart]=useState("10:00");
  const [end,setEnd]=useState("14:00");
  const [timezone,setTimezone]=useState("Asia/Riyadh");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  async function load(){
    if(!profile)return;
    const {data,error}=await supabase.from("teacher_availability").select("id,day_of_week,specific_date,start_time,end_time,timezone,status").eq("teacher_id",profile.id).order("day_of_week").order("specific_date").order("start_time");
    if(error)setMessage(error.message); else setRows(data||[]);
  }
  useEffect(()=>{load()},[profile?.id]);

  async function add(){
    if(!profile)return;
    setMessage("");
    if(start>=end){setMessage("وقت البداية يجب أن يسبق وقت النهاية.");return}
    setBusy(true);
    const {error}=await supabase.from("teacher_availability").insert({teacher_id:profile.id,day_of_week:date?null:Number(day),specific_date:date||null,start_time:start,end_time:end,timezone,status:"active"});
    setBusy(false);
    if(error){setMessage(error.message);return}
    setMessage("تمت إضافة وقت التوفر بنجاح.");
    setDate("");
    await load();
  }

  if(!profile)return null;
  if(profile.role!=="teacher")return <div dir="rtl" className="p-8 text-center">هذه الصفحة مخصصة للمعلمين.<div><Link href="/portal">العودة</Link></div></div>;

  return <div dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl justify-between px-5 py-4"><Link href="/portal">العودة للبوابة</Link><b>مُعلّم</b></div></header>
    <main className="mx-auto max-w-5xl px-5 py-8">
      <section className="rounded-[2rem] bg-[#182431] p-8 text-white"><p className="text-[#ffb36e]">إدارة المعلم</p><h1 className="mt-2 text-3xl font-extrabold">مواعيدي المتاحة</h1><p className="mt-3 text-sm text-white/65">أضف الأيام والساعات التي يمكن للطلاب حجزها.</p></section>
      {message&&<div className="mt-5 rounded-2xl bg-white p-4 text-sm font-bold">{message}</div>}
      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-extrabold">إضافة وقت توافر</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label>يوم أسبوعي<select disabled={!!date} value={day} onChange={e=>setDay(e.target.value)} className="mt-2 w-full rounded-xl bg-[#fbf8f4] p-3">{days.map((x,i)=><option key={x} value={i}>{x}</option>)}</select></label>
          <label>أو تاريخ محدد<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-2 w-full rounded-xl bg-[#fbf8f4] p-3"/></label>
          <label>من<input type="time" value={start} onChange={e=>setStart(e.target.value)} className="mt-2 w-full rounded-xl bg-[#fbf8f4] p-3"/></label>
          <label>إلى<input type="time" value={end} onChange={e=>setEnd(e.target.value)} className="mt-2 w-full rounded-xl bg-[#fbf8f4] p-3"/></label>
          <label className="md:col-span-2">المنطقة الزمنية<select value={timezone} onChange={e=>setTimezone(e.target.value)} className="mt-2 w-full rounded-xl bg-[#fbf8f4] p-3"><option value="Asia/Riyadh">السعودية — الرياض</option><option value="Africa/Cairo">مصر — القاهرة</option><option value="Asia/Dubai">الإمارات — دبي</option><option value="UTC">UTC</option></select></label>
        </div>
        <button disabled={busy} onClick={add} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#ff7a00] px-7 py-3 font-extrabold text-white"><Plus className="h-4 w-4"/>{busy?"جارٍ الحفظ...":"إضافة الموعد"}</button>
      </section>
      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-[#c55d08]"/><h2 className="font-extrabold">المواعيد الحالية</h2></div>
        {rows.length===0?<p className="mt-6 rounded-2xl bg-[#fbf8f4] p-6 text-sm text-black/50">لا توجد مواعيد مضافة حتى الآن.</p>:<div className="mt-5 grid gap-3 sm:grid-cols-2">{rows.map(x=><div key={x.id} className="rounded-2xl bg-[#fbf8f4] p-4"><b>{x.specific_date?("تاريخ محدد: "+x.specific_date):("كل "+days[x.day_of_week])}</b><div className="mt-2 flex items-center gap-2 text-sm text-black/55"><Clock3 className="h-4 w-4"/>{String(x.start_time).slice(0,5)} - {String(x.end_time).slice(0,5)}</div><div className="mt-1 text-xs text-black/40">{x.timezone}</div></div>)}</div>}
      </section>
    </main>
  </div>
}