import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, XCircle, ArrowRight } from "lucide-react";
import { Link, useSearchParams } from "wouter";
import { supabase } from "@/lib/supabase";

type Booking = { id:string; payment_status:string; status:string; total_price:number|null; currency:string };

export default function PaymentResult(){
  const [params] = useSearchParams();
  const bookingId = params.get("booking_id") || "";
  const [booking,setBooking]=useState<Booking|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!bookingId){setLoading(false);return;}
    let active=true;
    let timer:number|undefined;
    let attempts=0;
    const load=async()=>{
      const {data}=await supabase.from("bookings").select("id,payment_status,status,total_price,currency").eq("id",bookingId).maybeSingle();
      if(active)setBooking(data as Booking|null);
      setLoading(false);
      if(active && data?.payment_status==="pending" && attempts<8){
        attempts++;
        timer=window.setTimeout(load,2000);
      }
    };
    load();
    return()=>{active=false;if(timer)window.clearTimeout(timer);};
  },[bookingId]);

  const status=booking?.payment_status;
  const paid=status==="paid";
  const failed=status==="failed";
  const refunded=status==="refunded";

  return <div dir="rtl" className="min-h-screen bg-[#fbf8f4] text-[#182431]">
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-5 py-10">
      <section className="w-full rounded-[2rem] bg-white p-8 text-center shadow-sm">
        {loading?<><Clock3 className="mx-auto h-12 w-12 animate-pulse text-[#3974ff]"/><h1 className="mt-5 text-2xl font-black">جارٍ التحقق من الدفع...</h1></>:
        !bookingId?<><XCircle className="mx-auto h-12 w-12 text-red-500"/><h1 className="mt-5 text-2xl font-black">بيانات الدفع غير مكتملة</h1></>:
        paid?<><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500"/><h1 className="mt-5 text-2xl font-black">تم الدفع بنجاح</h1><p className="mt-3 text-sm leading-7 text-black/55">تم تأكيد الدفع للحجز. قيمة الحجز {booking?.total_price??"—"} {booking?.currency||""}.</p></>:
        failed?<><XCircle className="mx-auto h-14 w-14 text-red-500"/><h1 className="mt-5 text-2xl font-black">تعذر إتمام الدفع</h1><p className="mt-3 text-sm leading-7 text-black/55">يمكنك العودة إلى الحجوزات والمحاولة مرة أخرى.</p></>:
        refunded?<><XCircle className="mx-auto h-14 w-14 text-amber-500"/><h1 className="mt-5 text-2xl font-black">تم رد المبلغ</h1></>:
        <><Clock3 className="mx-auto h-14 w-14 text-amber-500"/><h1 className="mt-5 text-2xl font-black">جاري تأكيد الدفع</h1><p className="mt-3 text-sm leading-7 text-black/55">قد يستغرق تأكيد العملية لحظات. سنعتمد على إشعار بوابة الدفع لتحديث الحالة.</p></>}
        <Link href="/student/bookings" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#182431] px-6 py-3 text-sm font-bold text-white"><ArrowRight className="h-4 w-4"/> العودة إلى حجوزاتي</Link>
      </section>
    </main>
  </div>;
}
