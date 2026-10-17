import React from "react";
import { Link } from "wouter";
import { Wallet, Calendar, BookOpen, ArrowRight } from "lucide-react";

export default function Home() {
  const teacherSearchHref = "/teachers";

  return (
    <div dir="rtl" className="min-h-screen bg-[#F9F6F0] flex flex-col text-gray-900">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 text-right">
        <div className="max-w-4xl w-full mx-auto space-y-8">
          
          {/* Main Banner / Title */}
          <div className="space-y-4">
            <span className="text-amber-700 text-sm font-semibold tracking-wider bg-amber-100 px-3 py-1 rounded-full inline-block">
              اختيار المعلم المناسب
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              ابداً من احتياجك،<br />ثم اختر بثقة.
            </h1>
            <p className="text-lg text-gray-600 max-w-xl">
              استكشف ملفات المعلمين المتاحين، وقارن التخصصات والمواعيد والتكلفة قبل إرسال طلبك.
            </p>
            
            <div className="pt-2">
              <Link href={teacherSearchHref} className="inline-flex items-center gap-2 text-amber-700 font-semibold hover:text-amber-800 transition-colors">
                استكشف المعلمين <ArrowRight className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            
            {/* Card 1: بتكلفة واضحة */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">بتكلفة واضحة</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  راجع سعر الحصة ومدتها قبل اتخاذ قرارك.
                </p>
              </div>
              <div className="pt-6">
                <Link href={teacherSearchHref} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-amber-700 transition-colors">
                  عرض المعلمين <ArrowRight className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>

            {/* Card 2: حسب الموعد المناسب */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">حسب الموعد المناسب</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  راجع تفاصيل التوفر قبل إرسال طلب الحجز.
                </p>
              </div>
              <div className="pt-6">
                <Link href={teacherSearchHref} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-amber-700 transition-colors">
                  عرض المعلمين <ArrowRight className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>

            {/* Card 3: حسب المادة والمرحلة */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">حسب المادة والمرحلة</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  حدد ما تريد دراسته لتصل إلى الخيارات الأقرب لاحتياجك.
                </p>
              </div>
              <div className="pt-6">
                <Link href={teacherSearchHref} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-amber-700 transition-colors">
                  عرض المعلمين <ArrowRight className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
