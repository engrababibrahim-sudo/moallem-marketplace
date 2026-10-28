import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, Bell, BookOpen, CalendarDays, CheckCircle2, ChevronLeft, CircleDollarSign, Video,
  ClipboardCheck, FileText, GraduationCap, Headphones, LayoutDashboard, LogOut, Menu,
  Search, Settings, ShieldCheck, Sparkles, UserCheck, UserRound, Users, X, XCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Finance from "./Finance";
import AdminZoomAttendance from "./AdminZoomAttendance";
import ParentRequestsAdmin from "./ParentRequestsAdmin";
import AdminTeacherVerification from "./AdminTeacherVerification";
import { supabase } from "@/lib/supabase";

const menu = [
  ["الرئيسية","/admin",LayoutDashboard],
  ["المستخدمون","/admin/users",Users],
  ["الطلاب","/admin/students",GraduationCap],
  ["أولياء الأمور","/admin/parents",UserRound],
  ["طلبات المعلمين","/admin/teachers",ClipboardCheck],
  ["الحجوزات","/admin/bookings",CalendarDays],
  ["حضور لقاءات Zoom","/admin/attendance",Video],
  ["المالية والعمولة","/admin/finance",CircleDollarSign],
  ["المحتوى التعليمي","/admin/content",BookOpen],
  ["الدعم","/admin/support",Headphones],
  ["سجل التدقيق","/admin/audit",FileText],
  ["الإعدادات","/admin/settings",Settings],
] as const;

type Stats={users:number;teachers:number;pending:number;bookings:number;students:number;parents:number;paidBookings:number;paidByCurrency:Record<string,number>;userTrend:number[];bookingTrend:number[];teacherTrend:number[]};

export default function Admin(){
  const {profile,signOut}=useAuth();
  const [open,setOpen]=useState(false);
  const [location]=useLocation();
  if(!profile)return null;
  const current=menu.find(([,href])=>href===location);
  const title=current?.[0]??"الرئيسية";

  return <div dir="rtl" className="min-h-screen bg-[#f6f9fc] text-[#17233a]">
    <aside className={`fixed inset-y-0 right-0 z-50 w-[276px] overflow-hidden bg-gradient-to-b from-[#142a57] via-[#172e60] to-[#101f43] text-white shadow-2xl transition-transform lg:translate-x-0 ${open?"translate-x-0":"translate-x-full"}`}>
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/admin" onClick={()=>setOpen(false)} className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#2d8cff] to-[#6f5cff] shadow-lg shadow-blue-900/30"><GraduationCap className="h-6 w-6 text-white"/></span>
            <span><b className="text-xl">مُعلّم</b><span className="block text-[10px] text-white/55">منصة التعليم العالمية</span></span>
          </Link>
          <button onClick={()=>setOpen(false)} className="absolute left-4 top-5 rounded-xl bg-white/10 p-2 lg:hidden"><X className="h-5 w-5"/></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-3 text-[10px] font-extrabold tracking-widest text-white/35">إدارة المنصة</p>
          <div className="space-y-1.5">
            {menu.map(([label,href,Icon])=><Link key={href} href={href} onClick={()=>setOpen(false)} className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-bold transition-all ${location===href?"bg-gradient-to-l from-[#2d8cff] to-[#3974ff] text-white shadow-lg shadow-blue-900/20":"text-white/65 hover:bg-white/[.07] hover:text-white"}`}>
              <Icon className="h-[18px] w-[18px]"/>
              <span>{label}</span>
              {label==="طلبات المعلمين" && <PendingBadge/>}
            </Link>)}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[.06] p-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ffb347] to-[#ff6b9d] text-xs font-black">{(profile.full_name||profile.email||"م").slice(0,1)}</div>
            <div className="min-w-0"><p className="text-[10px] text-white/40">مساحة خاصة</p><p className="truncate text-[11px] font-bold">{profile.email}</p></div>
          </div>
          <button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[.06] py-3 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"><LogOut className="h-4 w-4"/>خروج</button>
        </div>
      </div>
    </aside>

    {open&&<button aria-label="إغلاق القائمة" className="fixed inset-0 z-40 bg-[#081631]/60 lg:hidden" onClick={()=>setOpen(false)}/>}
    <div className="min-h-screen lg:mr-[276px]">
      <header className="sticky top-0 z-30 border-b border-[#dce6f2] bg-white/95 backdrop-blur">
        <div className="flex h-[70px] items-center justify-between gap-4 px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={()=>setOpen(true)} className="rounded-xl border border-[#dce6f2] bg-white p-2 lg:hidden"><Menu className="h-5 w-5"/></button>
            <div>
              <p className="text-[10px] font-extrabold text-[#3974ff]">نظام الإدارة</p>
              <h1 className="text-lg font-black">{title}</h1>
            </div>
          </div>
          <div className="hidden max-w-md flex-1 items-center justify-center md:flex">
            <div className="flex w-full max-w-sm items-center rounded-xl border border-[#dce6f2] bg-[#f8fbff] px-3 py-2.5">
              <Search className="h-4 w-4 text-[#8da0b9]"/>
              <input placeholder="بحث في لوحة الإدارة..." className="w-full bg-transparent px-2 text-xs outline-none placeholder:text-[#9aabc0]"/>
              <kbd className="rounded-lg bg-white px-2 py-1 text-[9px] text-[#8da0b9] shadow-sm">⌘ K</kbd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#dce6f2] bg-white text-[#5d708b]"><Bell className="h-4 w-4"/><span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#ff5b73]"/></button>
            <div className="hidden items-center gap-2 rounded-xl border border-[#dce6f2] bg-white px-3 py-2 sm:flex"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#3c8cff] to-[#7857ff] text-xs font-black text-white">{(profile.full_name||"م").slice(0,1)}</span><span className="max-w-32 truncate text-[11px] font-bold">{profile.full_name||"مدير المنصة"}</span></div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1540px] p-5 lg:p-8">
        {location==="/admin"?<Dashboard/>:location==="/admin/users"?<UsersAdmin/>:location==="/admin/teachers"?<AdminTeacherVerification/>:location==="/admin/students"?<Students/>:location==="/admin/parents"?<ParentsAdmin/>:location==="/admin/parent-requests"?<ParentRequestsAdmin/>:location==="/admin/finance"?<Finance/>:location==="/admin/attendance"?<AdminZoomAttendance/>:location==="/admin/bookings"?<AdminBookings/>:<AdminSection title={title} location={location}/>}
      </main>
    </div>
  </div>;
}

function PendingBadge(){
  const [n,setN]=useState(0);
  useEffect(()=>{supabase.from("teacher_profiles").select("id",{count:"exact",head:true}).eq("verification_status","pending").then(({count})=>setN(count??0));},[]);
  return n>0?<span className="mr-auto min-w-5 rounded-full bg-[#ff5570] px-1.5 py-0.5 text-center text-[10px] text-white">{n}</span>:null;
}
function Dashboard(){
  const [s,setS]=useState<Stats>({users:0,teachers:0,pending:0,bookings:0,students:0,parents:0,paidBookings:0,paidByCurrency:{},userTrend:[],bookingTrend:[],teacherTrend:[]});
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const since=new Date();
    since.setDate(since.getDate()-6);
    since.setHours(0,0,0,0);
    const load=async()=>{
      const [u,t,p,b,st,pa,paid,usersTrend,bookingsTrend,teachersTrend]=await Promise.all([
        supabase.from("profiles").select("id",{count:"exact",head:true}),
        supabase.from("teacher_profiles").select("id",{count:"exact",head:true}).eq("verification_status","approved"),
        supabase.from("teacher_profiles").select("id",{count:"exact",head:true}).eq("verification_status","pending"),
        supabase.from("bookings").select("id",{count:"exact",head:true}),
        supabase.from("profiles").select("id",{count:"exact",head:true}).eq("role","student"),
        supabase.from("profiles").select("id",{count:"exact",head:true}).eq("role","parent"),
        supabase.from("bookings").select("total_price,currency").eq("payment_status","paid"),
        supabase.from("profiles").select("created_at").gte("created_at",since.toISOString()),
        supabase.from("bookings").select("created_at").gte("created_at",since.toISOString()),
        supabase.from("teacher_profiles").select("created_at").eq("verification_status","approved").gte("created_at",since.toISOString())
      ]);
      const days=Array.from({length:7},(_,i)=>{const d=new Date(since);d.setDate(since.getDate()+i);return d.toISOString().slice(0,10);});
      const countByDay=(rows:any[]|null)=>days.map(day=>(rows??[]).filter(x=>String(x.created_at).slice(0,10)===day).length);
      const paidByCurrency=(paid.data??[]).reduce<Record<string,number>>((acc,row)=>{const currency=String(row.currency||"EGP");acc[currency]=(acc[currency]||0)+Number(row.total_price??0);return acc;},{});
      setS({users:u.count??0,teachers:t.count??0,pending:p.count??0,bookings:b.count??0,students:st.count??0,parents:pa.count??0,paidBookings:paid.data?.length??0,paidByCurrency,userTrend:countByDay(usersTrend.data),bookingTrend:countByDay(bookingsTrend.data),teacherTrend:countByDay(teachersTrend.data)});
      setLoading(false);
    };
    load();
  },[]);;

  const roleTotal=Math.max(s.users,1);
  const roleData: [string, number, string][] = [
    ["طلاب",s.students,"#3b82f6"],
    ["أولياء أمور",s.parents,"#22c55e"],
    ["معلمون",s.teachers,"#8b5cf6"],
    ["طلبات أخرى",Math.max(s.users-s.students-s.parents-s.teachers,0),"#f59e0b"]
  ];
  const rolePercent=roleData.map(([label,value,color])=>({label,value:Number(value),color,pct:Math.round(Number(value)*100/roleTotal)}));

  return <>
    <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-l from-[#dff2ff] via-[#e9e7ff] to-[#fff3dd] p-7 shadow-sm lg:p-9">
      <div className="absolute -left-12 -top-20 h-60 w-60 rounded-full bg-[#55a8ff]/20 blur-3xl"/>
      <div className="absolute right-1/3 -bottom-20 h-56 w-56 rounded-full bg-[#a78bfa]/20 blur-3xl"/>
      <div className="relative flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[11px] font-extrabold text-[#3974ff]"><Sparkles className="h-3.5 w-3.5"/>مركز التحكم الرئيسي</div>
          <h2 className="text-3xl font-black tracking-tight text-[#142a57] lg:text-4xl">مرحبًا بك في نظام الإدارة ☀️</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#64748b]">إدارة منصة مُعلّم من مكان واحد — متابعة المعلمين والمستخدمين والحجوزات بسهولة واحترافية.</p>
        </div>
        <Link href="/admin/teachers" className="inline-flex items-center gap-2 rounded-2xl bg-[#2d7ff9] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-500/20 hover:bg-[#246ee0]"><ClipboardCheck className="h-4 w-4"/>مراجعة الطلبات <ChevronLeft className="h-4 w-4"/></Link>
      </div>
    </section>

    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard href="/admin/users" label="المستخدمون" value={s.users} compare="إجمالي حسابات المنصة · اضغط للفتح" icon={Users} tone="blue" loading={loading}/>
      <StatCard href="/admin/teachers" label="المعلمون" value={s.teachers} compare="معلمون معتمدون · اضغط للفتح" icon={UserCheck} tone="green" loading={loading}/>
      <StatCard href="/admin/teachers" label="طلبات المراجعة" value={s.pending} compare="تحتاج إلى إجراء · اضغط للفتح" icon={ClipboardCheck} tone="orange" loading={loading}/>
      <StatCard href="/admin/bookings" label="الحجوزات" value={s.bookings} compare={s.paidBookings+" مدفوعة · اضغط للفتح"} icon={CalendarDays} tone="purple" loading={loading}/>
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><Link href="/admin/finance" className="block rounded-[22px] border border-[#dfe8f2] bg-gradient-to-l from-[#eafff5] to-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#3974ff]"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-[#7b8da5]">المدفوعات · اضغط لفتح المالية</p><strong className="mt-2 block text-lg font-black text-[#142a57]">{s.paidBookings} حجز مدفوع</strong></div><CircleDollarSign className="h-6 w-6 text-[#18a86b]"/></div><div className="mt-4 flex flex-wrap gap-2">{Object.keys(s.paidByCurrency).length===0?<span className="text-[10px] font-bold text-[#8da0b9]">لا توجد مدفوعات مسجلة.</span>:Object.entries(s.paidByCurrency).map(([currency,total])=><span key={currency} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#16845b] shadow-sm">{Number(total??0).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:2})} {currency}</span>)}</div></Link><Link href="/admin/teachers" className="block rounded-[22px] border border-[#dfe8f2] bg-gradient-to-l from-[#fff6e8] to-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#3974ff]"><p className="text-xs font-bold text-[#7b8da5]">تنبيه إداري · اضغط لفتح طلبات المعلمين</p><strong className="mt-2 block text-lg font-black text-[#142a57]">{s.pending>0?"هناك طلبات معلمين تحتاج مراجعة":"لا توجد طلبات معلقة الآن"}</strong><p className="mt-2 text-[10px] font-bold text-[#d97706]">{s.pending>0?"افتح قسم طلبات المعلمين لمراجعتها.":"المنصة لا تحتاج إجراءً عاجلًا حاليًا."}</p></Link></div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.9fr]">
      <section className="rounded-[26px] border border-[#dfe8f2] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div><h3 className="font-black">إحصائيات المنصة</h3><p className="mt-1 text-xs text-[#8da0b9]">ملخص النشاط الحالي</p></div>
          <span className="rounded-xl bg-[#f4f8fd] px-3 py-2 text-[10px] font-bold text-[#60758f]">الوقت الحالي</span>
        </div>
        <div className="mt-6 rounded-2xl bg-gradient-to-b from-[#f8fbff] to-white p-5">
          <MiniChart userTrend={s.userTrend} bookingTrend={s.bookingTrend} teacherTrend={s.teacherTrend}/>
        </div>
      </section>

      <section className="rounded-[26px] border border-[#dfe8f2] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef4ff]"><Users className="h-5 w-5 text-[#3974ff]"/></span><div><h3 className="font-black">توزيع المستخدمين</h3><p className="text-xs text-[#8da0b9]">حسب نوع الحساب</p></div></div>
        <div className="mt-6 flex items-center gap-6">
          <Donut data={rolePercent}/>
          <div className="flex-1 space-y-3">{rolePercent.map(x=><div key={x.label} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-bold text-[#52657d]"><i className="h-2.5 w-2.5 rounded-full" style={{background:x.color}}/>{x.label}</span><b className="text-xs">{x.pct}%</b></div>)}</div>
        </div>
        <p className="mt-5 text-center text-[10px] text-[#9aabc0]">{Number(s.users ?? 0).toLocaleString()} إجمالي المستخدمين</p>
      </section>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr_1fr]">
      <section className="rounded-[26px] border border-[#dfe8f2] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between"><div><h3 className="font-black">طلبات المعلمين المعلقة</h3><p className="mt-1 text-xs text-[#8da0b9]">تحتاج مراجعة الإدارة</p></div><Link href="/admin/teachers" className="text-[11px] font-extrabold text-[#3974ff]">عرض الكل</Link></div>
        <div className="mt-5 rounded-2xl bg-gradient-to-l from-[#fff5e8] to-[#fffaf3] p-5">
          <div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffb347] text-white shadow-lg shadow-orange-200"><ClipboardCheck className="h-5 w-5"/></span><strong className="text-4xl font-black text-[#142a57]">{s.pending}</strong></div>
          <p className="mt-4 text-sm font-extrabold">طلب{ s.pending===1?"":"ات"} قيد المراجعة</p>
          <Link href="/admin/teachers" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#d97706]">فتح الطلبات <ChevronLeft className="h-4 w-4"/></Link>
        </div>
      </section>

      <section className="rounded-[26px] border border-[#dfe8f2] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9fff4]"><ShieldCheck className="h-5 w-5 text-[#10a86b]"/></span><div><h3 className="font-black">حالة المنصة</h3><p className="text-xs text-[#8da0b9]">المؤشرات الأساسية</p></div></div>
        <div className="mt-5 space-y-3"><Health label="قاعدة البيانات" text="متصلة وتعمل"/><Health label="نظام الصلاحيات" text="RLS مفعّل"/><Health label="دليل المعلمين" text="متاح للزوار"/></div>
      </section>

      <section className="rounded-[26px] border border-[#dfe8f2] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1ecff]"><Activity className="h-5 w-5 text-[#7c5cff]"/></span><div><h3 className="font-black">اختصارات سريعة</h3><p className="text-xs text-[#8da0b9]">أهم إجراءات الإدارة</p></div></div>
        <div className="mt-4 space-y-2"><Quick href="/admin/teachers" icon={ClipboardCheck} label="اعتماد المعلمين"/><Quick href="/admin/users" icon={Users} label="إدارة المستخدمين"/><Quick href="/admin/bookings" icon={CalendarDays} label="الحجوزات"/></div>
      </section>
    </div>

    <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#bdeedb] bg-[#eafff5] px-5 py-4 text-xs font-bold text-[#16845b]">
      <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/>حالة المنصة: تعمل بشكل طبيعي</span>
      <span className="text-[#5cae8b]">آخر تحديث: الآن</span>
    </div>
  </>;
}

function StatCard({href,label,value,compare,icon:Icon,tone,loading}:{href:string;label:string;value:number;compare:string;icon:any;tone:"blue"|"green"|"orange"|"purple";loading:boolean}){
 const styles={blue:["#eaf4ff","#2d7ff9"],green:["#eafff5","#18a86b"],orange:["#fff4df","#f59e0b"],purple:["#f2edff","#8b5cf6"]}[tone];
 return <Link href={href} aria-label={label+" - "+compare} className="group block rounded-[22px] border border-[#dfe8f2] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#b9d5ff] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#3974ff]"><div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl" style={{background:styles[0]}}><Icon className="h-5 w-5" style={{color:styles[1]}}/></span><ChevronLeft className="h-4 w-4 text-[#b2bfd0] transition group-hover:-translate-x-1"/></div><p className="mt-5 text-xs font-bold text-[#7b8da5]">{label}</p><strong className="mt-1 block text-3xl font-black text-[#142a57]">{loading?"—":Number(value ?? 0).toLocaleString()}</strong><p className="mt-2 text-[10px] font-bold" style={{color:styles[1]}}>{compare}</p></Link>;
}

function MiniChart({userTrend,bookingTrend,teacherTrend}:{userTrend:number[];bookingTrend:number[];teacherTrend:number[]}){
 const max=Math.max(...userTrend,...bookingTrend,...teacherTrend,1);
 const pts=(arr:number[])=>arr.map((v,i)=>`${35+i*83},${145-(v/max)*105}`).join(" ");
 const labels=["قبل 6 أيام","قبل 5 أيام","قبل 4 أيام","قبل 3 أيام","قبل يومين","أمس","اليوم"];
 return <svg viewBox="0 0 560 175" className="h-48 w-full" role="img" aria-label="النشاط الحقيقي خلال آخر 7 أيام">
  <g stroke="#e7edf5" strokeWidth="1">{[35,70,105,140].map(y=><line key={y} x1="25" x2="540" y1={y} y2={y}/>)}</g>
  <polyline points={pts(userTrend)} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  <polyline points={pts(bookingTrend)} fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  <polyline points={pts(teacherTrend)} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  {labels.map((label,i)=><text key={label} x={35+i*83} y="168" textAnchor="middle" fontSize="9" fill="#8da0b9">{label}</text>)}
 </svg>;
}

function Donut({data}:{data:{label:string;value:number;color:string;pct:number}[]}){
 const total=data.reduce((a,x)=>a+x.value,0)||1;
 let offset=0;
 return <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label="توزيع المستخدمين">
  <circle cx="60" cy="60" r="42" fill="none" stroke="#edf2f8" strokeWidth="14"/>
  {data.map(x=>{const length=x.value/total*264;const node=<circle key={x.label} cx="60" cy="60" r="42" fill="none" stroke={x.color} strokeWidth="14" strokeDasharray={`${length} ${264-length}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)"/>;offset+=length;return node;})}
  <text x="60" y="57" textAnchor="middle" fontSize="10" fill="#8da0b9">إجمالي</text>
  <text x="60" y="73" textAnchor="middle" fontSize="16" fontWeight="800" fill="#142a57">{total}</text>
 </svg>;
}

function Health({label,text}:{label:string;text:string}){
 return <div className="flex items-center justify-between rounded-xl bg-[#f8fbff] px-3 py-3"><span className="text-xs font-bold text-[#52657d]">{label}</span><span className="flex items-center gap-1.5 text-[10px] font-bold text-[#16845b]"><i className="h-1.5 w-1.5 rounded-full bg-[#22c55e]"/>{text}</span></div>;
}

function Quick({href,icon:Icon,label}:{href:string;icon:any;label:string}){
 return <Link href={href} className="flex items-center gap-3 rounded-xl border border-[#e5ecf4] px-3 py-3 text-xs font-bold transition hover:border-[#b9d5ff] hover:bg-[#f8fbff]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eef4ff]"><Icon className="h-4 w-4 text-[#3974ff]"/></span>{label}<ChevronLeft className="mr-auto h-4 w-4 text-[#aebdd0]"/></Link>;
}
 return <div className="relative h-32 w-32 shrink-0">
  <div className="h-full w-full rounded-full" style={{background:`conic-gradient(${gradient})`}}/>
  <div className="absolute inset-[18px] grid place-items-center rounded-full bg-white">
   <div className="text-center"><strong className="block text-xl font-black text-[#142a57]">{data.reduce((sum,x)=>sum+x.value,0)}</strong><span className="text-[9px] font-bold text-[#8da0b9]">مستخدم</span></div>
  </div>
 </div>;

function Health({label,text}:{label:string;text:string}){
 return <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f8fbff] px-3 py-3"><span className="text-xs font-bold text-[#52657d]">{label}</span><span className="flex items-center gap-1.5 text-[10px] font-bold text-[#18a86b]"><i className="h-1.5 w-1.5 rounded-full bg-[#18a86b]"/>{text}</span></div>;
}

function Quick({href,icon:Icon,label}:{href:string;icon:any;label:string}){
 return <Link href={href} className="flex items-center justify-between rounded-xl border border-[#e5edf6] px-3 py-3 text-xs font-bold text-[#52657d] transition hover:border-[#b9d5ff] hover:bg-[#f8fbff] hover:text-[#3974ff]"><span className="flex items-center gap-2"><Icon className="h-4 w-4"/>{label}</span><ChevronLeft className="h-4 w-4"/></Link>;
}

function AdminSection({title,location}:{title:string;location:string}){
 return <section className="rounded-[26px] border border-[#dfe8f2] bg-white p-8 shadow-sm">
  <div className="mb-5 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef4ff]"><LayoutDashboard className="h-6 w-6 text-[#3974ff]"/></span><div><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-xs text-[#8da0b9]">إدارة ومتابعة {title}</p></div></div>
  <p className="text-sm leading-7 text-[#64748b]">هذا القسم جاهز لاستكمال وظائف الإدارة الخاصة به.</p>
  <p className="mt-2 text-xs text-[#9aabc0]">المسار الحالي: {location}</p>
 </section>;
}

function UsersAdmin(){
 const [users,setUsers]=useState<any[]>([]);
 const [loading,setLoading]=useState(true);
 const [search,setSearch]=useState("");
 const [error,setError]=useState("");

 useEffect(()=>{
  let active=true;
  const load=async()=>{
   setLoading(true);
   const {data,error}=await supabase.from("profiles").select("id,full_name,email,role,created_at").order("created_at",{ascending:false}).limit(500);
   if(!active)return;
   if(error)setError(error.message);
   else setUsers(data??[]);
   setLoading(false);
  };
  load();
  return ()=>{active=false;};
 },[]);

 const filtered=useMemo(()=>users.filter(u=>`${u.full_name??""} ${u.email??""} ${u.role??""}`.toLowerCase().includes(search.toLowerCase())),[users,search]);

 return <section className="rounded-[26px] border border-[#dfe8f2] bg-white p-5 shadow-sm lg:p-7">
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
   <div><h2 className="text-xl font-black">إدارة المستخدمين</h2><p className="mt-1 text-xs text-[#8da0b9]">إجمالي الحسابات: {users.length}</p></div>
   <div className="flex items-center gap-2 rounded-xl border border-[#dce6f2] bg-[#f8fbff] px-3 py-2.5"><Search className="h-4 w-4 text-[#8da0b9]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الدور" className="w-full min-w-0 bg-transparent text-xs outline-none sm:w-64"/></div>
  </div>
  {error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">تعذر تحميل المستخدمين: {error}</p>}
  <div className="mt-5 overflow-x-auto">
   <table className="w-full min-w-[650px] text-right text-xs">
    <thead><tr className="border-b border-[#e5edf6] text-[#8da0b9]"><th className="p-3">الاسم</th><th className="p-3">البريد الإلكتروني</th><th className="p-3">نوع الحساب</th><th className="p-3">تاريخ التسجيل</th></tr></thead>
    <tbody>{loading?<tr><td colSpan={4} className="p-8 text-center text-[#8da0b9]">جارٍ تحميل المستخدمين...</td></tr>:filtered.length===0?<tr><td colSpan={4} className="p-8 text-center text-[#8da0b9]">لا توجد نتائج.</td></tr>:filtered.map(u=><tr key={u.id} className="border-b border-[#eef2f7] last:border-0 hover:bg-[#f8fbff]"><td className="p-3 font-bold">{u.full_name||"—"}</td><td className="p-3 text-[#64748b]">{u.email||"—"}</td><td className="p-3"><span className="rounded-lg bg-[#eef4ff] px-2 py-1 font-bold text-[#3974ff]">{u.role||"user"}</span></td><td className="p-3 text-[#64748b]">{u.created_at?new Date(u.created_at).toLocaleDateString("ar-EG"):"—"}</td></tr>)}</tbody>
   </table>
  </div>
 </section>;
}

function Students(){
 const [students,setStudents]=useState<any[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");

 useEffect(()=>{
  let active=true;
  const load=async()=>{
   const {data,error}=await supabase.from("profiles").select("id,full_name,email,created_at").eq("role","student").order("created_at",{ascending:false});
   if(!active)return;
   if(error)setError(error.message);
   else setStudents(data??[]);
   setLoading(false);
  };
  load();
  return ()=>{active=false;};
 },[]);

 return <section className="rounded-[26px] border border-[#dfe8f2] bg-white p-5 shadow-sm lg:p-7">
  <div className="mb-5"><h2 className="text-xl font-black">إدارة الطلاب</h2><p className="mt-1 text-xs text-[#8da0b9]">عدد الطلاب المسجلين: {students.length}</p></div>
  {error&&<p className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">تعذر تحميل الطلاب: {error}</p>}
  <div className="overflow-x-auto"><table className="w-full min-w-[550px] text-right text-xs"><thead><tr className="border-b border-[#e5edf6] text-[#8da0b9]"><th className="p-3">الاسم</th><th className="p-3">البريد الإلكتروني</th><th className="p-3">تاريخ التسجيل</th></tr></thead><tbody>{loading?<tr><td colSpan={3} className="p-8 text-center">جارٍ التحميل...</td></tr>:students.length===0?<tr><td colSpan={3} className="p-8 text-center text-[#8da0b9]">لا يوجد طلاب مسجلون.</td></tr>:students.map(s=><tr key={s.id} className="border-b border-[#eef2f7] last:border-0"><td className="p-3 font-bold">{s.full_name||"—"}</td><td className="p-3 text-[#64748b]">{s.email||"—"}</td><td className="p-3 text-[#64748b]">{s.created_at?new Date(s.created_at).toLocaleDateString("ar-EG"):"—"}</td></tr>)}</tbody></table></div>
 </section>;
}

function ParentsAdmin(){
 const [parents,setParents]=useState<any[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");

 useEffect(()=>{
  let active=true;
  const load=async()=>{
   const {data,error}=await supabase.from("profiles").select("id,full_name,email,created_at").eq("role","parent").order("created_at",{ascending:false});
   if(!active)return;
   if(error)setError(error.message);
   else setParents(data??[]);
   setLoading(false);
  };
  load();
  return ()=>{active=false;};
 },[]);

 return <section className="rounded-[26px] border border-[#dfe8f2] bg-white p-5 shadow-sm lg:p-7">
  <div className="mb-5"><h2 className="text-xl font-black">إدارة أولياء الأمور</h2><p className="mt-1 text-xs text-[#8da0b9]">عدد الحسابات: {parents.length}</p></div>
  {error&&<p className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">تعذر تحميل أولياء الأمور: {error}</p>}
  <div className="overflow-x-auto"><table className="w-full min-w-[550px] text-right text-xs"><thead><tr className="border-b border-[#e5edf6] text-[#8da0b9]"><th className="p-3">الاسم</th><th className="p-3">البريد الإلكتروني</th><th className="p-3">تاريخ التسجيل</th></tr></thead><tbody>{loading?<tr><td colSpan={3} className="p-8 text-center">جارٍ التحميل...</td></tr>:parents.length===0?<tr><td colSpan={3} className="p-8 text-center text-[#8da0b9]">لا يوجد أولياء أمور مسجلون.</td></tr>:parents.map(p=><tr key={p.id} className="border-b border-[#eef2f7] last:border-0"><td className="p-3 font-bold">{p.full_name||"—"}</td><td className="p-3 text-[#64748b]">{p.email||"—"}</td><td className="p-3 text-[#64748b]">{p.created_at?new Date(p.created_at).toLocaleDateString("ar-EG"):"—"}</td></tr>)}</tbody></table></div>
 </section>;
}

function AdminBookings(){
 const [bookings,setBookings]=useState<any[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");

 useEffect(()=>{
  let active=true;
  const load=async()=>{
   const {data,error}=await supabase.from("bookings").select("id,student_id,teacher_id,subject,start_at,end_at,status,payment_status,total_price,currency,created_at").order("created_at",{ascending:false}).limit(500);
   if(!active)return;
   if(error)setError(error.message);
   else setBookings(data??[]);
   setLoading(false);
  };
  load();
  return ()=>{active=false;};
 },[]);

 return <section className="rounded-[26px] border border-[#dfe8f2] bg-white p-5 shadow-sm lg:p-7">
  <div className="mb-5"><h2 className="text-xl font-black">إدارة الحجوزات</h2><p className="mt-1 text-xs text-[#8da0b9]">إجمالي الحجوزات: {bookings.length}</p></div>
  {error&&<p className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">تعذر تحميل الحجوزات: {error}</p>}
  <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-right text-xs"><thead><tr className="border-b border-[#e5edf6] text-[#8da0b9]"><th className="p-3">رقم الحجز</th><th className="p-3">الطالب</th><th className="p-3">المعلم</th><th className="p-3">المادة</th><th className="p-3">الموعد</th><th className="p-3">الحالة</th><th className="p-3">الدفع</th><th className="p-3">القيمة</th></tr></thead><tbody>{loading?<tr><td colSpan={8} className="p-8 text-center">جارٍ تحميل الحجوزات...</td></tr>:bookings.length===0?<tr><td colSpan={8} className="p-8 text-center text-[#8da0b9]">لا توجد حجوزات.</td></tr>:bookings.map(b=><tr key={b.id} className="border-b border-[#eef2f7] last:border-0"><td className="p-3 font-bold">{String(b.id).slice(0,8)}</td><td className="p-3">{String(b.student_id??"—").slice(0,8)}</td><td className="p-3">{String(b.teacher_id??"—").slice(0,8)}</td><td className="p-3">{b.subject||"—"}</td><td className="p-3">{b.start_at?new Date(b.start_at).toLocaleString("ar-EG"):"—"}</td><td className="p-3">{b.status||"—"}</td><td className="p-3">{b.payment_status||"—"}</td><td className="p-3 font-bold">{b.total_price??"—"} {b.currency||""}</td></tr>)}</tbody></table></div>
 </section>;
}
