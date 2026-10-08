import { Link } from "wouter";
import { LayoutDashboard, Users, GraduationCap, UserRound, ClipboardCheck, CalendarDays, CircleDollarSign, BookOpen, Headphones, FileText, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

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
  if(!profile)return null;
  return <div dir="rtl" className="min-h-screen bg-[#f6f7f9] text-[#182431]">
    <aside className={`fixed inset-y-0 right-0 z-40 w-72 bg-white border-l border-black/[.06] transition-transform lg:translate-x-0 ${open?"translate-x-0":"translate-x-full"}`}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b p-5">
          <Link href="/admin" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#182431] text-white"><GraduationCap className="h-5 w-5"/></span><div><b>مُعلّم</b><span className="block text-xs text-black/45">نظام الإدارة</span></div></Link>
          <button className="lg:hidden" onClick={()=>setOpen(false)}><X/></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menu.map(([label,href,Icon])=><Link key={href} href={href} onClick={()=>setOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-black/65 hover:bg-black/[.04]"><Icon className="h-4 w-4"/>{label}</Link>)}
        </nav>
        <div className="border-t p-4"><p className="text-xs text-black/45">مساحة خاصة</p><p className="truncate text-sm font-bold">{profile.email}</p><button onClick={signOut} className="mt-3 flex w-full justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold"><LogOut className="h-4 w-4"/>خروج</button></div>
      </div>
    </aside>
    {open&&<button className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={()=>setOpen(false)}/>}
    <div className="min-h-screen lg:mr-72">
      <header className="flex h-16 items-center border-b bg-white px-5 lg:px-8"><button className="mr-2 rounded-xl border p-2 lg:hidden" onClick={()=>setOpen(true)}><Menu/></button><div><p className="text-xs font-bold text-[#c55d08]">لوحة الإدارة</p><h1 className="font-extrabold">نظام الإدارة</h1></div></header>
      <main className="p-5 lg:p-8"><section className="rounded-[2rem] bg-[#182431] p-8 text-white"><p className="text-sm font-bold text-[#ffb36e]">مركز الإدارة</p><h2 className="mt-2 text-3xl font-extrabold">مرحبًا بك في نظام الإدارة</h2><p className="mt-3 text-sm text-white/60">إدارة المنصة من مكان واحد.</p></section>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card title="المستخدمون"/><Card title="المعلمون"/><Card title="طلبات المراجعة"/><Card title="الحجوزات"/></div>
      </main>
    </div>
  </div>;
}
function Card({title}:{title:string}){return <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-black/50">{title}</p><strong className="mt-2 block text-3xl">—</strong><p className="mt-2 text-xs text-black/40">سيتم ربط البيانات الفعلية في القسم.</p></div>}
