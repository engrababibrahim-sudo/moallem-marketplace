import { useEffect, useMemo, useRef, useState } from "react";
import { getOnboardingProgress } from "../../../shared/onboarding";
import { Link, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  GraduationCap,
  Languages,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";

type Onboarding = {
  role: string;
  stage: string;
  grade: string;
  subject: string;
  goal: string;
  level: string;
  needs: string;
  format: string;
  time: string;
};

const initial: Onboarding = {
  role: "",
  stage: "",
  grade: "",
  subject: "",
  goal: "",
  level: "",
  needs: "",
  format: "",
  time: "",
};

const teachers = [
  {
    id: "sara",
    name: "سارة محمود",
    subject: "رياضيات",
    stage: "الثانوية العامة",
    years: 8,
    rating: "4.9",
    price: "٣٢٠",
    match: "٩٤٪",
    initials: "س",
    color: "#f6e2d5",
    area: "القاهرة · أونلاين",
  },
  {
    id: "omar",
    name: "عمر عبدالسلام",
    subject: "فيزياء",
    stage: "الثانوية العامة",
    years: 6,
    rating: "4.8",
    price: "٢٨٠",
    match: "٩١٪",
    initials: "ع",
    color: "#e4eadc",
    area: "الجيزة · أونلاين",
  },
  {
    id: "noura",
    name: "نورهان علي",
    subject: "لغة إنجليزية",
    stage: "الإعدادية",
    years: 10,
    rating: "5.0",
    price: "٢٥٠",
    match: "٨٩٪",
    initials: "ن",
    color: "#e9e2f1",
    area: "الإسكندرية · أونلاين",
  },
];

const faqs = [
  "كيف أختار المعلم المناسب؟",
  "هل أستطيع متابعة تعلم أكثر من ابن؟",
  "كيف يتم حجز الدرس؟",
  "هل الأسعار المعروضة نهائية؟",
];
