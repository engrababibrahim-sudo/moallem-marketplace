import { CalendarDays, CheckCircle2, MessageCircle, Search, Target } from "lucide-react";

const steps = [
  [Target, "أخبرنا عن هدفك", "أجب عن أسئلة قصيرة لنفهم المرحلة والمادة والهدف."],
  [Search, "نرشح لك المعلم المناسب", "نرتب خيارات Demo مع سبب توافق مفهوم."],
  [CalendarDays, "احجز وتعلم", "اختر الوقت المناسب وابدأ مع معلم حقيقي."],
  [CheckCircle2, "تابع تطورك", "اقرأ تقرير الحصة وشاهد الخطوة التعليمية القادمة."],
] as const;

const testimonials = [
  ["ولي أمر Demo", "أصبحت أعرف ما الذي يحتاجه ابني بعد كل حصة، بدل أن أنتظر نهاية الشهر."],
  ["طالب Demo", "أحببت أن الترشيح يشرح لي لماذا يناسبني المعلم، وليس مجرد قائمة أسماء."],
  ["معلم Demo", "الملف الواضح يساعدني على استقبال طلاب يناسبون أسلوبي وخبرتي."],
];

export default function HomeAdditions() {
  return <>
    <section className="border-y border-[#182431]/8 bg-[#fbf8f4] py-24"><div className="mx-auto max-w-7xl px-5 lg:px-10"><div className="text-center"><p className="mb-4 text-sm font-bold text-[#ff7a00]">كيف تعمل نُخبة؟</p><h2 className="text-4xl font-bold md:text-5xl">أربع خطوات لبداية أوضح.</h2></div><div className="mt-12 grid gap-4 md:grid-cols-4">{steps.map(([Icon, title, text], i) => <div key={title} className="relative rounded-[1.5rem] bg-white p-6"><span className="absolute left-5 top-5 text-xs font-bold text-[#182431]/25">0{i + 1}</span><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0e2] text-[#ff7a00]"><Icon className="h-5 w-5"/></span><h3 className="mt-8 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#182431]/55">{text}</p></div>)}</div></div></section>
    <section className="bg-white py-24"><div className="mx-auto max-w-7xl px-5 lg:px-10"><div className="flex items-end justify-between gap-6"><div><p className="mb-4 text-sm font-bold text-[#ff7a00]">تجارب تجريبية — Demo</p><h2 className="text-4xl font-bold md:text-5xl">صوت التجربة قبل الإطلاق.</h2></div><MessageCircle className="hidden h-10 w-10 text-[#e8a64a] md:block"/></div><div className="mt-12 grid gap-4 md:grid-cols-3">{testimonials.map(([role, quote]) => <figure key={role} className="rounded-[1.5rem] bg-[#fbf8f4] p-6"><div className="flex gap-1 text-[#e8a64a]">{[1, 2, 3, 4, 5].map(n => <span key={n}>★</span>)}</div><blockquote className="mt-5 text-sm leading-7 text-[#182431]/70">“{quote}”</blockquote><figcaption className="mt-6 text-xs font-bold text-[#ff7a00]">{role}</figcaption></figure>)}</div></div></section>
  </>;
}
