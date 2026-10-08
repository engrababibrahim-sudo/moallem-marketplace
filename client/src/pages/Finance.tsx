import { useEffect, useState } from "react";
import { CircleDollarSign, CreditCard, Percent, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Row={id:string;booking_id:string;amount:number;currency:string;platform_commission_rate:number;platform_commission_amount:number;teacher_net_amount:number;status:string;created_at:string};

const money=(n:number,c:string)=>`${Number(n||0).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:2})} ${c}`;

export default function Finance(){
 const [rows,setRows]=useState<Row[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{(async()=>{const {data,error:e}=await supabase.from("payment_transactions").select("id,booking_id,amount,currency,platform_commission_rate,platform_commission_amount,teacher_net_amount,status,created_at").order("created_at",{ascending:false});if(e){setError("تعذر تحميل البيانات المالية.");}else setRows((data??[]) as Row[]);setLoading(false);})();},[]);
 const totals=rows.reduce((a,r)=>{const c=r.currency||"EGP";a[c]??={amount:0,commission:0,teacher:0};a[c].amount+=Number(r.amount||0);a[c].commission+=Number(r.platform_commission_amount||0);a[c].teacher+=Number(r.teacher_net_amount||0);return a;},{} as Record<string,{amount:number;commission:number;teacher:number}>);
 const paid=rows.filter(r=>r.status==="paid");
 const unpaid=rows.filter(r=>r.status==="unpaid");
 return <section>
  <div className="rounded-[30px] bg-gradient-to-l from-[#e0f2ff] via-[#eef0ff] to-[#fff2dd] p-7 shadow-sm lg:p-9">
   <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-extrabold text-[#3974ff]"><CircleDollarSign className="h-3.5 w-3.5"/>المركز المالي</div><h2 className="mt-4 text-3xl font-black text-[#142a57]">المالية والعمولة</h2><p className="mt-3 text-sm leading-7 text-[#64748b]">متابعة قيمة الحجوزات وعمولة المنصة وصافي مستحقات المعلمين.</p></div><div className="rounded-2xl bg-white/80 px-5 py-4 text-center"><b className="block text-2xl font-black text-[#3974ff]">20%</b><span className="text-xs font-bold text-[#64748b]">عمولة المنصة</span></div></div>
  </div>
  {error&&<div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
   <Card icon={CreditCard} label="المعاملات" value={rows.length} note="إجمالي السجلات"/>
   <Card icon={Wallet} label="غير مدفوع" value={unpaid.length} note="معاملة" />
   <Card icon={CircleDollarSign} label="مدفوع" value={paid.length} note="معاملة"/>
   <Card icon={Percent} label="نسبة العمولة" value="20%" note="من كل حجز مؤكد"/>
  </div>
  <div className="mt-6 grid gap-4">{loading?<div className="rounded-3xl bg-white p-10 text-center text-sm text-black/45">جارٍ تحميل البيانات المالية...</div>:Object.keys(totals).length===0?<div className="rounded-3xl bg-white p-10 text-center text-sm text-black/45">لا توجد معاملات مالية حتى الآن.</div>:Object.entries(totals).map(([currency,t])=><div key={currency} className="rounded-3xl border border-[#dfe8f2] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h3 className="text-xl font-black">إجمالي {currency}</h3><span className="rounded-xl bg-[#eef4ff] px-3 py-2 text-xs font-black text-[#3974ff]">20% عمولة</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="إجمالي الحجوزات" value={money(t.amount,currency)}/><Metric label="عمولة مُعلّم" value={money(t.commission,currency)}/><Metric label="صافي المعلمين" value={money(t.teacher,currency)}/></div></div>)}</div>
  <div className="mt-6 overflow-hidden rounded-3xl border border-[#dfe8f2] bg-white shadow-sm"><div className="border-b border-[#e6edf5] p-5"><h3 className="font-black">تفاصيل المعاملات</h3></div><div className="overflow-x-auto"><table className="min-w-full text-right text-sm"><thead className="bg-[#f8fbff] text-xs text-[#71839b]"><tr><th className="px-5 py-4">الحجز</th><th className="px-5 py-4">القيمة</th><th className="px-5 py-4">العمولة</th><th className="px-5 py-4">المعلم</th><th className="px-5 py-4">الحالة</th></tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-t border-[#edf2f7]"><td className="px-5 py-4 font-mono text-xs">{r.booking_id.slice(0,8)}...</td><td className="px-5 py-4 font-bold">{money(r.amount,r.currency)}</td><td className="px-5 py-4 font-bold text-[#3974ff]">{money(r.platform_commission_amount,r.currency)} <span className="text-xs text-black/35">({r.platform_commission_rate}%)</span></td><td className="px-5 py-4 font-bold">{money(r.teacher_net_amount,r.currency)}</td><td className="px-5 py-4"><span className={"rounded-full px-3 py-1 text-xs font-bold "+(r.status==="paid"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700")}>{r.status==="paid"?"مدفوع":"غير مدفوع"}</span></td></tr>)}</tbody></table></div></div>
 </section>;
}
function Card({icon:Icon,label,value,note}:{icon:any;label:string;value:string|number;note:string}){return <div className="rounded-3xl border border-[#dfe8f2] bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-[#3974ff]"/><p className="mt-4 text-xs font-bold text-[#7b8da5]">{label}</p><b className="mt-1 block text-2xl font-black">{value}</b><span className="text-[10px] text-[#8da0b9]">{note}</span></div>}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl bg-[#f8fbff] p-4"><span className="text-xs text-[#7b8da5]">{label}</span><b className="mt-2 block text-lg font-black">{value}</b></div>}
