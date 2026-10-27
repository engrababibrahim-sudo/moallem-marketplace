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
  ["اعتماد المدرسين","/admin/teachers",UserCheck],
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
