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
  <polyline points={pts(userTrend)} fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  <polyline points={pts(bookingTrend)} fill="none" stroke="#20b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  <polyline points={pts(teacherTrend)} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  {[...Array(7)].map((_,i)=><text key={i} x={35+i*83} y="166" textAnchor="middle" fontSize="8" fill="#8da0b9">{labels[i]}</text>)}
 </svg>;
}

function Donut({data}:{data:{label:string;value:number;color:string;pct:number}[]}){
 let offset=0;
 const gradient=data.map(x=>{const start=offset;offset+=x.pct;return `${x.color} ${start}% ${offset}%`;}).join(",");
 return <div className="relative h-36 w-36 shrink-0 rounded-full" style={{background:`conic-gradient(${gradient})`}}><div className="absolute inset-4 grid place-items-center rounded-full bg-white shadow-inner"><div className="text-center"><b className="block text-xl font-black">%</b><span className="text-[9px] text-[#8da0b9]">التوزيع</span></div></div></div>;
}

function Health({label,text}:{label:string;text:string}){return <div className="flex items-center justify-between rounded-xl bg-[#f8fbfd] px-3 py-3"><span className="text-xs font-bold text-[#53677f]">{label}</span><span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#10a86b]"><span className="h-2 w-2 rounded-full bg-[#10a86b]"/>{text}</span></div>;}
function Quick({href,icon:Icon,label}:{href:string;icon:any;label:string}){return <Link href={href} className="flex items-center gap-3 rounded-xl border border-[#e4ebf3] bg-[#fbfdff] px-3 py-3 text-xs font-bold hover:border-[#b9d5ff] hover:bg-[#f4f9ff]"><Icon className="h-4 w-4 text-[#3974ff]"/>{label}<ChevronLeft className="mr-auto h-4 w-4 text-[#aebdd0]"/></Link>}

function TeacherRequests(){
 const [items,setItems]=useState<any[]>([]);const [selected,setSelected]=useState<any|null>(null);const [reason,setReason]=useState("");const [busy,setBusy]=useState(false);const [search,setSearch]=useState("");
 const load=async()=>{const {data}=await supabase.from("teacher_profiles").select("id,display_name,bio,qualification,specialization,years_experience,subjects,education_stages,grades,teaching_format,hourly_rate,currency,rejection_reason,created_at").eq("verification_status","pending").order("created_at",{ascending:true});setItems(data??[]);};
 useEffect(()=>{load();},[]);
 const filtered=useMemo(()=>{const q=search.trim().toLowerCase();return q?items.filter(t=>[t.display_name,t.specialization,...(t.subjects||[])].filter(Boolean).join(" ").toLowerCase().includes(q)):items;},[items,search]);
 const review=async(status:"approved"|"rejected")=>{if(!selected)return;setBusy(true);const u=await supabase.auth.getUser();const {error}=await supabase.from("teacher_profiles").update({verification_status:status,rejection_reason:status==="rejected"?(reason.trim()||"يرجى استكمال البيانات وإعادة الإرسال."):null,reviewed_by:u.data.user?.id,reviewed_at:new Date().toISOString()}).eq("id",selected.id);setBusy(false);if(!error){setSelected(null);setReason("");load();}};
 return <section className="rounded-[26px] border border-[#dfe8f2] bg-white shadow-sm"><div className="border-b border-[#e5ecf4] p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0e5]"><ClipboardCheck className="h-4 w-4 text-[#f59e0b]"/></span><h2 className="text-xl font-black">طلبات اعتماد المعلمين</h2></div><p className="mt-2 text-xs text-[#8da0b9]">راجع الملف قبل ظهور المعلم في السوق.</p></div><div className="flex w-full max-w-md items-center gap-3"><div className="flex flex-1 items-center rounded-xl bg-[#f7faff] px-3 py-2.5"><Search className="h-4 w-4 text-[#8da0b9]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم أو التخصص..." className="w-full bg-transparent px-2 text-xs outline-none"/></div><span className="rounded-xl bg-[#fff0e5] px-3 py-2.5 text-xs font-black text-[#d97706]">{items.length} طلب</span></div></div></div>
 <div className="p-6">{filtered.length===0?<div className="rounded-2xl bg-[#f8fbfd] p-10 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-[#10a86b]"/><h3 className="mt-3 font-extrabold">لا توجد طلبات معلقة</h3><p className="mt-1 text-xs text-[#8da0b9]">جميع طلبات المعلمين تمت معالجتها.</p></div>:<div className="overflow-hidden rounded-2xl border border-[#e5ecf4]"><div className="hidden grid-cols-[1.4fr_1fr_.7fr_.8fr_auto] gap-4 bg-[#f8fbff] px-5 py-3 text-[10px] font-extrabold text-[#8da0b9] md:grid"><span>المعلم</span><span>التخصص</span><span>الخبرة</span><span>السعر</span><span/></div>{filtered.map(t=><button key={t.id} onClick={()=>{setSelected(t);setReason("");}} className="grid w-full gap-3 border-b border-[#edf1f6] px-5 py-4 text-right last:border-0 hover:bg-[#f9fcff] md:grid-cols-[1.4fr_1fr_.7fr_.8fr_auto] md:items-center"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#dff0ff] to-[#e9e1ff] text-xs font-black text-[#3974ff]">{(t.display_name||"م").slice(0,2)}</span><div><b className="text-sm">{t.display_name||"معلم بدون اسم"}</b><p className="mt-1 text-[10px] text-[#8da0b9]">{t.subjects?.slice(0,2).join(" · ")||"لم يحدد المواد"}</p></div></div><span className="text-xs text-[#61748c]">{t.specialization||"غير محدد"}</span><span className="text-xs text-[#61748c]">{t.years_experience||0} سنة</span><span className="text-xs font-bold">{t.hourly_rate??"—"} {t.currency||""}</span><span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#3974ff]">مراجعة <ChevronLeft className="h-4 w-4"/></span></button>)}</div>}</div>
 {selected&&<div className="fixed inset-0 z-[60] grid place-items-center bg-[#081631]/60 p-4"><div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-[28px] bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e5ecf4] bg-white p-6"><div><p className="text-[11px] font-bold text-[#3974ff]">مراجعة طلب المعلم</p><h3 className="mt-1 text-2xl font-black">{selected.display_name||"معلم"}</h3></div><button onClick={()=>setSelected(null)} className="rounded-xl bg-[#f3f6fa] p-2"><X className="h-4 w-4"/></button></div><div className="p-6"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Info label="المؤهل" value={selected.qualification}/><Info label="التخصص" value={selected.specialization}/><Info label="الخبرة" value={(selected.years_experience||0)+" سنة"}/><Info label="السعر" value={selected.hourly_rate?(selected.hourly_rate+" "+(selected.currency||"EGP")+" / ساعة"):"غير محدد"}/><Info label="المواد" value={selected.subjects?.join("، ")}/><Info label="المراحل" value={selected.education_stages?.join("، ")}/><Info label="الصفوف" value={selected.grades?.join("، ")}/><Info label="صيغة التدريس" value={selected.teaching_format}/></div><div className="mt-5 rounded-2xl bg-[#f7faff] p-5"><p className="mb-2 text-[11px] font-extrabold text-[#8da0b9]">نبذة المعلم</p><p className="text-sm leading-7 text-[#53677f]">{selected.bio||"لا توجد نبذة."}</p></div><textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="ملاحظة للمعلم عند الرفض (اختياري)" className="mt-5 min-h-24 w-full rounded-2xl border border-[#dce6f2] bg-white p-4 text-sm outline-none focus:border-[#3974ff]"/><div className="mt-5 grid gap-3 sm:grid-cols-2"><button disabled={busy} onClick={()=>review("approved")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10a86b] py-3.5 text-sm font-extrabold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4"/>اعتماد المعلم</button><button disabled={busy} onClick={()=>review("rejected")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff5b73] py-3.5 text-sm font-extrabold text-white disabled:opacity-50"><XCircle className="h-4 w-4"/>رفض الطلب</button></div></div></div></div>}
 </section>;
}


function UsersAdmin(){
  type UserRow={id:string;full_name:string|null;email:string|null;role:string;account_status:string;created_at:string};
  const [items,setItems]=useState<UserRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [error,setError]=useState("");
  useEffect(()=>{
    let alive=true;
    (async()=>{
      const {data,error}=await supabase.from("profiles").select("id,full_name,email,role,account_status,created_at").order("created_at",{ascending:false});
      if(!alive)return;
      if(error)setError(error.message);
      setItems((data??[]) as UserRow[]);
      setLoading(false);
    })();
    return ()=>{alive=false};
  },[]);
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return items.filter(x=>[x.full_name,x.email,x.role,x.id].some(v=>String(v??"").toLowerCase().includes(q)));
  },[items,search]);
  const roleNames:Record<string,string>={student:"طالب",parent:"ولي أمر",teacher:"معلم",admin:"مدير",super_admin:"مدير عام",support:"دعم"};
  const roleLabel=(role:string)=>roleNames[role]||role;
  const statusLabel=(status:string)=>status==="active"?"نشط":status==="suspended"?"موقوف":status==="deactivated"?"معطّل":status;
  return <section className="rounded-[26px] border border-[#dfe8f2] bg-white shadow-sm">
    <div className="border-b border-[#e5ecf4] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-black">إدارة المستخدمين</h2><p className="mt-2 text-xs text-[#8da0b9]">عرض حسابات المنصة وبريد الدخول والدور المرتبط بكل حساب. هذه الصفحة للعرض فقط ولا تغيّر الصلاحيات.</p></div>
        <div className="flex items-center gap-2 rounded-xl bg-[#f7faff] px-3 py-2.5 sm:w-80"><Search className="h-4 w-4 text-[#8da0b9]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الدور..." className="w-full bg-transparent text-xs outline-none"/></div>
      </div>
    </div>
    <div className="grid gap-3 p-6 sm:grid-cols-3">
      <div className="rounded-2xl bg-[#f7faff] p-4"><p className="text-[10px] font-bold text-[#8da0b9]">إجمالي الحسابات</p><b className="mt-1 block text-2xl font-black">{items.length}</b></div>
      <div className="rounded-2xl bg-[#eafff5] p-4"><p className="text-[10px] font-bold text-[#16845b]">حسابات المعلمين</p><b className="mt-1 block text-2xl font-black">{items.filter(x=>x.role==="teacher").length}</b></div>
      <div className="rounded-2xl bg-[#fff6e8] p-4"><p className="text-[10px] font-bold text-[#b96a00]">نتائج البحث</p><b className="mt-1 block text-2xl font-black">{filtered.length}</b></div>
    </div>
    <div className="px-6 pb-6">
      {loading?<div className="rounded-2xl bg-[#f8fbfd] p-8 text-center text-sm font-bold text-[#71849b]">جارٍ تحميل الحسابات...</div>
      :error?<div className="rounded-2xl bg-[#fff0f1] p-5 text-sm font-bold text-[#c3344b]">تعذر تحميل الحسابات: {error}</div>
      :filtered.length===0?<div className="rounded-2xl bg-[#f8fbfd] p-8 text-center text-sm font-bold text-[#71849b]">لا توجد حسابات مطابقة للبحث.</div>
      :<div className="overflow-x-auto rounded-2xl border border-[#e5ecf4]"><table className="w-full min-w-[650px] text-right text-xs"><thead className="bg-[#f8fbff] text-[#8da0b9]"><tr><th className="px-4 py-3">الاسم</th><th className="px-4 py-3">البريد الإلكتروني</th><th className="px-4 py-3">الدور</th><th className="px-4 py-3">الحالة</th><th className="px-4 py-3">معرّف الحساب</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id} className="border-t border-[#edf1f6]"><td className="px-4 py-4 font-extrabold">{x.full_name||"بدون اسم"}</td><td className="px-4 py-4" dir="ltr">{x.email||"بدون بريد"}</td><td className="px-4 py-4">{roleLabel(x.role)}</td><td className="px-4 py-4">{statusLabel(x.account_status)}</td><td className="px-4 py-4 font-mono text-[10px]" dir="ltr">{x.id}</td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}

function Students(){
  type Student={id:string;full_name:string|null;email:string|null;phone:string|null;city:string|null;country:string|null;account_status:string;created_at:string;education_stage:string|null;grade:string|null;learning_level:string|null;preferred_subjects:string[]|null;preferred_format:string|null};
  const [items,setItems]=useState<Student[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState("all");
  const [selected,setSelected]=useState<Student|null>(null);
  const load=async()=>{
    setLoading(true);
    const {data}=await supabase.from("profiles").select("id,full_name,email,phone,city,country,account_status,created_at,student_profiles(education_stage,grade,learning_level,preferred_subjects,preferred_format)").eq("role","student").order("created_at",{ascending:false});
    const rows=(data??[]).map((x:any)=>({id:x.id,full_name:x.full_name,email:x.email,phone:x.phone,city:x.city,country:x.country,account_status:x.account_status,created_at:x.created_at,...(x.student_profiles?.[0]??{})}));
    setItems(rows);setLoading(false);
  };
  useEffect(()=>{load();},[]);
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return items.filter(s=>{
      const matchesStatus=status==="all"||s.account_status===status;
      const hay=[s.full_name,s.email,s.phone,s.city,s.country,s.education_stage,s.grade,...(s.preferred_subjects??[])].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus&&(!q||hay.includes(q));
    });
  },[items,search,status]);
  const statusLabel=(v:string)=>v==="active"?"نشط":v==="suspended"?"موقوف":"معطّل";
  const statusClass=(v:string)=>v==="active"?"bg-[#eafff5] text-[#16845b]":v==="suspended"?"bg-[#fff4df] text-[#b96a00]":"bg-[#ffecef] text-[#d33b55]";
  return <section className="rounded-[26px] border border-[#dfe8f2] bg-white shadow-sm">
    <div className="border-b border-[#e5ecf4] p-6"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef4ff]"><GraduationCap className="h-4 w-4 text-[#3974ff]"/></span><h2 className="text-xl font-black">إدارة الطلاب</h2></div><p className="mt-2 text-xs text-[#8da0b9]">بيانات الطلاب المسجلين وحالتهم التعليمية وحساباتهم.</p></div><div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-2xl"><div className="flex flex-1 items-center rounded-xl bg-[#f7faff] px-3 py-2.5"><Search className="h-4 w-4 text-[#8da0b9]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الهاتف أو المادة..." className="w-full bg-transparent px-2 text-xs outline-none"/></div><select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-[#e0e8f2] bg-white px-3 py-2.5 text-xs font-bold outline-none"><option value="all">كل الحالات</option><option value="active">نشط</option><option value="suspended">موقوف</option><option value="deactivated">معطّل</option></select></div></div></div>
    <div className="grid gap-3 p-6 sm:grid-cols-3"><div className="rounded-2xl bg-[#f7faff] p-4"><p className="text-[10px] font-bold text-[#8da0b9]">إجمالي الطلاب</p><b className="mt-1 block text-2xl font-black text-[#142a57]">{items.length}</b></div><div className="rounded-2xl bg-[#eafff5] p-4"><p className="text-[10px] font-bold text-[#16845b]">حسابات نشطة</p><b className="mt-1 block text-2xl font-black text-[#142a57]">{items.filter(x=>x.account_status==="active").length}</b></div><div className="rounded-2xl bg-[#fff6e8] p-4"><p className="text-[10px] font-bold text-[#b96a00]">نتائج البحث</p><b className="mt-1 block text-2xl font-black text-[#142a57]">{filtered.length}</b></div></div>
    <div className="px-6 pb-6">{loading?<div className="rounded-2xl bg-[#f8fbfd] p-10 text-center text-sm font-bold text-[#71849b]">جاري تحميل الطلاب...</div>:filtered.length===0?<div className="rounded-2xl bg-[#f8fbfd] p-10 text-center"><GraduationCap className="mx-auto h-8 w-8 text-[#9aabc0]"/><h3 className="mt-3 font-extrabold">لا توجد نتائج</h3><p className="mt-1 text-xs text-[#8da0b9]">لم نجد طلابًا يطابقون معايير البحث الحالية.</p></div>:<div className="overflow-hidden rounded-2xl border border-[#e5ecf4]"><div className="hidden grid-cols-[1.5fr_1fr_1fr_.8fr_auto] gap-4 bg-[#f8fbff] px-5 py-3 text-[10px] font-extrabold text-[#8da0b9] md:grid"><span>الطالب</span><span>المرحلة / الصف</span><span>المواد المفضلة</span><span>الحالة</span><span/></div>{filtered.map(s=><button key={s.id} onClick={()=>setSelected(s)} className="grid w-full gap-3 border-b border-[#edf1f6] px-5 py-4 text-right last:border-0 hover:bg-[#f9fcff] md:grid-cols-[1.5fr_1fr_1fr_.8fr_auto] md:items-center"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#dff0ff] to-[#e9e1ff] text-xs font-black text-[#3974ff]">{(s.full_name||"ط").slice(0,2)}</span><div className="min-w-0"><b className="block truncate text-sm">{s.full_name||"طالب بدون اسم"}</b><p className="mt-1 truncate text-[10px] text-[#8da0b9]">{s.email||"بدون بريد"}</p></div></div><span className="text-xs text-[#61748c]">{s.education_stage||"غير محدد"} {s.grade?"· "+s.grade:""}</span><span className="truncate text-xs text-[#61748c]">{s.preferred_subjects?.slice(0,3).join(" · ")||"لم يحدد مواد"}</span><span className={statusClass(s.account_status)}>{statusLabel(s.account_status)}</span><ChevronLeft className="h-4 w-4 text-[#aebdd0]"/></button>)}</div>}</div>
    {selected&&<div className="fixed inset-0 z-[60] grid place-items-center bg-[#081631]/60 p-4"><div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-[28px] bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e5ecf4] bg-white p-6"><div><p className="text-[11px] font-bold text-[#3974ff]">ملف الطالب</p><h3 className="mt-1 text-2xl font-black">{selected.full_name||"طالب بدون اسم"}</h3></div><button onClick={()=>setSelected(null)} className="rounded-xl bg-[#f3f6fa] p-2"><X className="h-4 w-4"/></button></div><div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3"><Info label="البريد الإلكتروني" value={selected.email}/><Info label="الهاتف" value={selected.phone}/><Info label="الدولة" value={selected.country}/><Info label="المدينة" value={selected.city}/><Info label="المرحلة" value={selected.education_stage}/><Info label="الصف" value={selected.grade}/><Info label="مستوى التعلم" value={selected.learning_level}/><Info label="صيغة التعلم" value={selected.preferred_format}/><Info label="الحالة" value={statusLabel(selected.account_status)}/></div><div className="mx-6 mb-6 rounded-2xl bg-[#f7faff] p-5"><p className="mb-2 text-[11px] font-extrabold text-[#8da0b9]">المواد المفضلة</p><p className="text-sm leading-7 text-[#53677f]">{selected.preferred_subjects?.join("، ")||"لم يحدد الطالب مواد مفضلة بعد."}</p></div></div></div>}
  </section>;
}

function Info({label,value}:{label:string;value:any}){return <div className="rounded-2xl border border-[#e5ecf4] bg-[#f9fbfd] p-4"><span className="block text-[10px] font-bold text-[#8da0b9]">{label}</span><b className="mt-1 block text-sm text-[#17233a]">{value||"—"}</b></div>}

function AdminBookings(){
  type BookingRow={id:string;student_id:string;teacher_id:string;subject:string|null;start_at:string;end_at:string;timezone:string|null;total_price:number|null;currency:string|null;status:string;payment_status:string|null;created_at:string;notes:string|null;student_name?:string|null;student_email?:string|null;teacher_name?:string|null};
  const [items,setItems]=useState<BookingRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState("all");
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    let alive=true;
    (async()=>{
      setLoading(true);setError("");
      const {data,error}=await supabase.from("bookings").select("id,student_id,teacher_id,subject,start_at,end_at,timezone,total_price,currency,status,payment_status,created_at,notes").order("created_at",{ascending:false});
      if(!alive)return;
            if(error){setError(error.message);setItems([]);setLoading(false);return;}
      const rows=(data??[]) as BookingRow[];
      const ids=[...new Set(rows.flatMap(x=>[x.student_id,x.teacher_id]).filter(Boolean))];
      let profiles:{id:string;full_name:string|null;email:string|null}[]=[];
      if(ids.length){
        const p=await supabase.from("profiles").select("id,full_name,email").in("id",ids);
        if(p.error){console.error("Could not load booking profile names",p.error);}
        profiles=(p.data??[]) as typeof profiles;
      }
      const profileMap=new Map(profiles.map(x=>[x.id,x]));
      const named=rows.map(x=>({...x,student_name:profileMap.get(x.student_id)?.full_name,student_email:profileMap.get(x.student_id)?.email,teacher_name:profileMap.get(x.teacher_id)?.full_name}));
      if(alive)setItems(named);
      setLoading(false);
    })();
    return ()=>{alive=false};
  },[refresh]);
  const statusNames:Record<string,string>={pending:"في انتظار التأكيد",confirmed:"مؤكد",cancelled:"ملغي",completed:"مكتمل",rejected:"مرفوض"};
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return items.filter(x=>(status==="all"||x.status===status)&&(!q||[x.student_name,x.student_email,x.teacher_name,x.subject,x.id].some(v=>String(v??"").toLowerCase().includes(q))));
  },[items,search,status]);
  const money=(x:BookingRow)=>x.total_price==null?"—":Number(x.total_price).toLocaleString("ar-EG",{maximumFractionDigits:2})+" "+(x.currency||"EGP");
  const date=(x:BookingRow)=>{try{return new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:x.timezone||"Africa/Cairo"}).format(new Date(x.start_at));}catch{return x.start_at;}};
  return <section className="rounded-[26px] border border-[#dfe8f2] bg-white shadow-sm">
    <div className="border-b border-[#e5ecf4] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="text-xl font-black">إدارة الحجوزات</h2><p className="mt-2 text-xs text-[#8da0b9]">عرض حجوزات الطلاب مع المعلمين وحالة كل حجز وقيمته.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex items-center rounded-xl bg-[#f7faff] px-3 py-2.5"><Search className="h-4 w-4 text-[#8da0b9]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالطالب أو المعلم أو المادة..." className="w-full min-w-48 bg-transparent px-2 text-xs outline-none"/></div>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-[#e0e8f2] bg-white px-3 py-2.5 text-xs font-bold outline-none"><option value="all">كل الحالات</option><option value="pending">في انتظار التأكيد</option><option value="confirmed">مؤكد</option><option value="cancelled">ملغي</option><option value="completed">مكتمل</option><option value="rejected">مرفوض</option></select>
          <button onClick={()=>setRefresh(x=>x+1)} className="rounded-xl bg-[#142a57] px-4 py-2.5 text-xs font-extrabold text-white">تحديث</button>
        </div>
      </div>
    </div>
    <div className="grid gap-3 p-6 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl bg-[#f7faff] p-4"><p className="text-[10px] font-bold text-[#8da0b9]">إجمالي الحجوزات</p><b className="mt-1 block text-2xl font-black">{items.length}</b></div>
      <div className="rounded-2xl bg-[#fff6e8] p-4"><p className="text-[10px] font-bold text-[#b96a00]">بانتظار التأكيد</p><b className="mt-1 block text-2xl font-black">{items.filter(x=>x.status==="pending").length}</b></div>
      <div className="rounded-2xl bg-[#eafff5] p-4"><p className="text-[10px] font-bold text-[#16845b]">حجوزات مؤكدة</p><b className="mt-1 block text-2xl font-black">{items.filter(x=>x.status==="confirmed").length}</b></div>
      <div className="rounded-2xl bg-[#eef4ff] p-4"><p className="text-[10px] font-bold text-[#3974ff]">نتائج العرض</p><b className="mt-1 block text-2xl font-black">{filtered.length}</b></div>
    </div>
    <div className="px-6 pb-6">
      {loading?<div className="rounded-2xl bg-[#f8fbfd] p-10 text-center text-sm font-bold text-[#71849b]">جارٍ تحميل الحجوزات...</div>
      :error?<div className="rounded-2xl bg-[#fff0f1] p-5 text-sm font-bold text-[#c3344b]"><p>تعذر تحميل الحجوزات من قاعدة البيانات.</p><p className="mt-2 break-words font-mono text-xs" dir="ltr">{error}</p><p className="mt-2 text-xs">إذا كانت الرسالة متعلقة بالصلاحيات (RLS)، فسنحتاج إلى ضبط سياسة القراءة لحسابات الإدارة.</p></div>
      :filtered.length===0?<div className="rounded-2xl bg-[#f8fbfd] p-10 text-center"><CalendarDays className="mx-auto h-8 w-8 text-[#9aabc0]"/><h3 className="mt-3 font-extrabold">لا توجد حجوزات مطابقة</h3><p className="mt-1 text-xs text-[#8da0b9]">{items.length===0?"لم يتم تسجيل حجوزات بعد.":"جرّبي تغيير البحث أو حالة الحجز."}</p></div>
      :<div className="overflow-x-auto rounded-2xl border border-[#e5ecf4]"><table className="w-full min-w-[900px] text-right text-xs"><thead className="bg-[#f8fbff] text-[#8da0b9]"><tr><th className="px-4 py-3">الطالب</th><th className="px-4 py-3">المعلم</th><th className="px-4 py-3">المادة</th><th className="px-4 py-3">موعد الدرس</th><th className="px-4 py-3">القيمة</th><th className="px-4 py-3">الدفع</th><th className="px-4 py-3">الحالة</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id} className="border-t border-[#edf1f6] align-top"><td className="px-4 py-4"><b>{x.student_name||"طالب"}</b><span className="mt-1 block text-[10px] text-[#8da0b9]" dir="ltr">{x.student_email||""}</span></td><td className="px-4 py-4 font-bold">{x.teacher_name||"معلم"}</td><td className="px-4 py-4">{x.subject||"غير محددة"}</td><td className="px-4 py-4">{date(x)}<span className="mt-1 block text-[10px] text-[#8da0b9]">{x.timezone||"Africa/Cairo"}</span></td><td className="px-4 py-4 font-extrabold">{money(x)}</td><td className="px-4 py-4">{x.payment_status==="paid"?"مدفوع":x.payment_status==="unpaid"?"غير مدفوع":x.payment_status||"—"}</td><td className="px-4 py-4"><span className={"inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold "+(x.status==="confirmed"?"bg-[#eafff5] text-[#16845b]":x.status==="pending"?"bg-[#fff4df] text-[#b96a00]":"bg-[#f1f5f9] text-[#52657d]")}>{statusNames[x.status]||x.status}</span></td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}


function ParentsAdmin(){
  type ParentRow={id:string;full_name:string|null;email:string|null;phone:string|null;country:string|null;city:string|null;account_status:string|null;created_at:string};
  const [items,setItems]=useState<ParentRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [error,setError]=useState("");
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    let alive=true;
    (async()=>{
      setLoading(true);
      setError("");
      const {data,error}=await supabase.from("profiles").select("id,full_name,email,phone,country,city,account_status,created_at").eq("role","parent").order("created_at",{ascending:false});
      if(!alive)return;
      if(error){
        console.error("Failed to load parent accounts",error);
        setError(error.message);
        setItems([]);
      }else{
        setItems((data??[]) as ParentRow[]);
      }
      setLoading(false);
    })();
    return ()=>{alive=false;};
  },[refresh]);
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return items.filter(x=>[x.full_name,x.email,x.phone,x.country,x.city].some(v=>String(v??"").toLowerCase().includes(q)));
  },[items,search]);
  const activeCount=items.filter(x=>x.account_status==="active").length;
  return <section className="rounded-[26px] border border-[#dfe8f2] bg-white shadow-sm">
    <div className="border-b border-[#e5ecf4] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-xl font-black">إدارة أولياء الأمور</h2><p className="mt-2 text-xs leading-6 text-[#8da0b9]">قائمة حسابات أولياء الأمور المسجلين على المنصة. الطلبات المرسلة من نموذج المساعدة تظهر بشكل منفصل في «طلبات أولياء الأمور» ولا تُعدّ حسابات دخول تلقائيًا.</p></div>
        <button type="button" onClick={()=>setRefresh(v=>v+1)} disabled={loading} className="shrink-0 rounded-xl bg-[#142a57] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50">{loading?"جارٍ التحديث...":"تحديث البيانات"}</button>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f7faff] px-3 py-3 sm:max-w-md"><Search className="h-4 w-4 text-[#8da0b9]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الهاتف..." className="w-full bg-transparent text-xs outline-none"/></div>
    </div>
    <div className="grid gap-3 p-6 sm:grid-cols-3"><div className="rounded-2xl bg-[#f7faff] p-4"><p className="text-[10px] font-bold text-[#8da0b9]">إجمالي أولياء الأمور المسجلين</p><b className="mt-1 block text-2xl font-black">{loading?"—":items.length}</b></div><div className="rounded-2xl bg-[#eafff5] p-4"><p className="text-[10px] font-bold text-[#16845b]">حسابات نشطة</p><b className="mt-1 block text-2xl font-black">{loading?"—":activeCount}</b></div><div className="rounded-2xl bg-[#eef4ff] p-4"><p className="text-[10px] font-bold text-[#3974ff]">نتائج البحث</p><b className="mt-1 block text-2xl font-black">{loading?"—":filtered.length}</b></div></div>
    <div className="px-6 pb-6">
      {loading?<div className="rounded-2xl bg-[#f8fbfd] p-8 text-center text-sm">جارٍ تحميل حسابات أولياء الأمور...</div>
      :error?<div className="rounded-2xl bg-[#fff0f1] p-5 text-sm text-[#c3344b]"><p className="font-extrabold">تعذر تحميل حسابات أولياء الأمور من قاعدة البيانات.</p><p className="mt-2 break-words font-mono text-xs" dir="ltr">{error}</p><p className="mt-2 text-xs leading-6">تحققي من صلاحيات القراءة وسياسات RLS في Supabase؛ لا تعني هذه الرسالة أن عدد الحسابات صفر.</p></div>
      :items.length===0?<div className="rounded-2xl bg-[#f8fbfd] p-8 text-center"><p className="font-extrabold text-[#263b5b]">لا توجد حسابات لأولياء أمور مسجلة حتى الآن.</p><p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-[#71849b]">إذا وصلتنا طلبات مساعدة تعليمية، فستظهر في صفحة «طلبات أولياء الأمور». إرسال الطلب لا ينشئ حسابًا على المنصة تلقائيًا.</p><a href="/admin/parent-requests" className="mt-4 inline-flex rounded-xl border border-[#dfe8f2] bg-white px-4 py-2.5 text-xs font-extrabold text-[#3974ff] hover:bg-[#f4f9ff]">عرض طلبات أولياء الأمور</a></div>
      :filtered.length===0?<div className="rounded-2xl bg-[#f8fbfd] p-8 text-center text-sm font-bold text-[#71849b]">لا توجد حسابات مطابقة للبحث. جرّبي اسمًا أو بريدًا أو رقم هاتف مختلفًا.</div>
      :<div className="overflow-x-auto rounded-2xl border border-[#e5ecf4]"><table className="w-full min-w-[600px] text-right text-xs"><thead className="bg-[#f8fbff] text-[#8da0b9]"><tr><th className="px-4 py-3">الاسم</th><th className="px-4 py-3">البريد الإلكتروني</th><th className="px-4 py-3">الهاتف</th><th className="px-4 py-3">المدينة / الدولة</th><th className="px-4 py-3">الحالة</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id} className="border-t border-[#edf1f6]"><td className="px-4 py-4 font-extrabold">{x.full_name||"بدون اسم"}</td><td className="px-4 py-4" dir="ltr">{x.email||"—"}</td><td className="px-4 py-4" dir="ltr">{x.phone||"—"}</td><td className="px-4 py-4">{[x.city,x.country].filter(Boolean).join("، ")||"—"}</td><td className="px-4 py-4">{x.account_status==="active"?"نشط":x.account_status==="suspended"?"موقوف":x.account_status==="deactivated"?"معطّل":x.account_status||"—"}</td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}

function AdminSection({title,location}:{title:string;location:string}){
  const details:Record<string,{description:string;items:string[];icon:any}>={
    "/admin/content":{description:"مساحة إدارة المحتوى التعليمي للمنصة. استخدمي الاختصارات للوصول مباشرة إلى الأقسام المرتبطة.",items:["مراجعة طلبات المعلمين","متابعة الطلاب المسجلين","عرض الحجوزات"],icon:BookOpen},
    "/admin/support":{description:"مركز متابعة دعم المستخدمين. عرض تذاكر الدعم والمحادثات يحتاج ربطه بجدول التذاكر في قاعدة البيانات.",items:["عرض المستخدمين","مراجعة طلبات المعلمين","عرض الحجوزات"],icon:Headphones},
    "/admin/audit":{description:"سجل متابعة إجراءات الإدارة. عرض الأحداث الفعلية يحتاج ربط سجل التدقيق بمصدر الأحداث في قاعدة البيانات.",items:["إدارة المستخدمين","طلبات المعلمين","الإعدادات"],icon:FileText},
    "/admin/settings":{description:"إعدادات إدارة المنصة. حفظ الإعدادات التشغيلية يحتاج تحديد القيم وربطها بقاعدة البيانات.",items:["إدارة المستخدمين","المالية والعمولة","سجل التدقيق"],icon:Settings}
  };
  const info=details[location]||{description:"تم فتح القسم المطلوب. اختاري أحد الاختصارات للوصول مباشرة إلى بيانات الإدارة المتاحة.",items:["إدارة المستخدمين","إدارة الطلاب","إدارة الحجوزات"],icon:LayoutDashboard};
  const Icon=info.icon;
  const links:Record<string,string>={"مراجعة طلبات المعلمين":"/admin/teachers","متابعة الطلاب المسجلين":"/admin/students","عرض الحجوزات":"/admin/bookings","عرض المستخدمين":"/admin/users","إدارة المستخدمين":"/admin/users","طلبات المعلمين":"/admin/teachers","الإعدادات":"/admin/settings","المالية والعمولة":"/admin/finance","سجل التدقيق":"/admin/audit","إدارة الطلاب":"/admin/students","إدارة الحجوزات":"/admin/bookings"};
  return <section className="rounded-[26px] border border-[#dfe8f2] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start gap-4 border-b border-[#e5ecf4] pb-6"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#eef4ff]"><Icon className="h-6 w-6 text-[#3974ff]"/></span><div><p className="text-[11px] font-extrabold text-[#3974ff]">إدارة المنصة</p><h2 className="mt-1 text-2xl font-black">{title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[#71849b]">{info.description}</p></div></div><h3 className="mt-6 font-black">اختصارات هذا القسم</h3><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{info.items.map(item=><Link key={item} href={links[item]||"/admin"} className="flex items-center gap-3 rounded-2xl border border-[#e5ecf4] bg-[#fbfdff] p-4 text-sm font-bold transition hover:border-[#b9d5ff] hover:bg-[#f4f9ff]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef4ff]"><ChevronLeft className="h-4 w-4 text-[#3974ff]"/></span>{item}<ChevronLeft className="mr-auto h-4 w-4 text-[#aebdd0]"/></Link>)}</div><Link href="/admin" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#142a57] px-5 py-3 text-sm font-bold text-white">العودة إلى لوحة الإدارة <ChevronLeft className="h-4 w-4"/></Link></section>;
}
      if(error){setError(error.message);setItems([]);setLoading(false);return;}
      const rows=(data??[]) as BookingRow[];
      const ids=[...new Set(rows.flatMap(x=>[x.student_id,x.teacher_id]).filter(Boolean))];
      let profiles:{id:string;full_name:string|null;email:string|null}[]=[];
      if(ids.length){
        const p=await supabase.from("profiles").select("id,full_name,email").in("id",ids);
        if(p.error){console.error("Could not load booking profile names",p.error);}
        profiles=(p.data??[]) as typeof profiles;
      }
      const profileMap=new Map(profiles.map(x=>[x.id,x]));
      const named=rows.map(x=>({...x,student_name:profileMap.get(x.student_id)?.full_name,student_email:profileMap.get(x.student_id)?.email,teacher_name:profileMap.get(x.teacher_id)?.full_name}));
      if(alive)setItems(named);
      setLoading(false);
    })();
    return ()=>{alive=false};
  },[refresh]);
  const statusNames:Record<string,string>={pending:"في انتظار التأكيد",confirmed:"مؤكد",cancelled:"ملغي",completed:"مكتمل",rejected:"مرفوض"};
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return items.filter(x=>(status==="all"||x.status===status)&&(!q||[x.student_name,x.student_email,x.teacher_name,x.subject,x.id].some(v=>String(v??"").toLowerCase().includes(q))));
  },[items,search,status]);
  const money=(x:BookingRow)=>x.total_price==null?"—":Number(x.total_price).toLocaleString("ar-EG",{maximumFractionDigits:2})+" "+(x.currency||"EGP");
  const date=(x:BookingRow)=>{try{return new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:x.timezone||"Africa/Cairo"}).format(new Date(x.start_at));}catch{return x.start_at;}};
  return <section className="rounded-[26px] border border-[#dfe8f2] bg-white shadow-sm">
    <div className="border-b border-[#e5ecf4] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="text-xl font-black">إدارة الحجوزات</h2><p className="mt-2 text-xs text-[#8da0b9]">عرض حجوزات الطلاب مع المعلمين وحالة كل حجز وقيمته.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex items-center rounded-xl bg-[#f7faff] px-3 py-2.5"><Search className="h-4 w-4 text-[#8da0b9]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالطالب أو المعلم أو المادة..." className="w-full min-w-48 bg-transparent px-2 text-xs outline-none"/></div>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-[#e0e8f2] bg-white px-3 py-2.5 text-xs font-bold outline-none"><option value="all">كل الحالات</option><option value="pending">في انتظار التأكيد</option><option value="confirmed">مؤكد</option><option value="cancelled">ملغي</option><option value="completed">مكتمل</option><option value="rejected">مرفوض</option></select>
          <button onClick={()=>setRefresh(x=>x+1)} className="rounded-xl bg-[#142a57] px-4 py-2.5 text-xs font-extrabold text-white">تحديث</button>
        </div>
      </div>
    </div>
    <div className="grid gap-3 p-6 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl bg-[#f7faff] p-4"><p className="text-[10px] font-bold text-[#8da0b9]">إجمالي الحجوزات</p><b className="mt-1 block text-2xl font-black">{items.length}</b></div>
      <div className="rounded-2xl bg-[#fff6e8] p-4"><p className="text-[10px] font-bold text-[#b96a00]">بانتظار التأكيد</p><b className="mt-1 block text-2xl font-black">{items.filter(x=>x.status==="pending").length}</b></div>
      <div className="rounded-2xl bg-[#eafff5] p-4"><p className="text-[10px] font-bold text-[#16845b]">حجوزات مؤكدة</p><b className="mt-1 block text-2xl font-black">{items.filter(x=>x.status==="confirmed").length}</b></div>
      <div className="rounded-2xl bg-[#eef4ff] p-4"><p className="text-[10px] font-bold text-[#3974ff]">نتائج العرض</p><b className="mt-1 block text-2xl font-black">{filtered.length}</b></div>
    </div>
    <div className="px-6 pb-6">
      {loading?<div className="rounded-2xl bg-[#f8fbfd] p-10 text-center text-sm font-bold text-[#71849b]">جارٍ تحميل الحجوزات...</div>
      :error?<div className="rounded-2xl bg-[#fff0f1] p-5 text-sm font-bold text-[#c3344b]"><p>تعذر تحميل الحجوزات من قاعدة البيانات.</p><p className="mt-2 break-words font-mono text-xs" dir="ltr">{error}</p><p className="mt-2 text-xs">إذا كانت الرسالة متعلقة بالصلاحيات (RLS)، فسنحتاج إلى ضبط سياسة القراءة لحسابات الإدارة.</p></div>
      :filtered.length===0?<div className="rounded-2xl bg-[#f8fbfd] p-10 text-center"><CalendarDays className="mx-auto h-8 w-8 text-[#9aabc0]"/><h3 className="mt-3 font-extrabold">لا توجد حجوزات مطابقة</h3><p className="mt-1 text-xs text-[#8da0b9]">{items.length===0?"لم يتم تسجيل حجوزات بعد.":"جرّبي تغيير البحث أو حالة الحجز."}</p></div>
      :<div className="overflow-x-auto rounded-2xl border border-[#e5ecf4]"><table className="w-full min-w-[900px] text-right text-xs"><thead className="bg-[#f8fbff] text-[#8da0b9]"><tr><th className="px-4 py-3">الطالب</th><th className="px-4 py-3">المعلم</th><th className="px-4 py-3">المادة</th><th className="px-4 py-3">موعد الدرس</th><th className="px-4 py-3">القيمة</th><th className="px-4 py-3">الدفع</th><th className="px-4 py-3">الحالة</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id} className="border-t border-[#edf1f6] align-top"><td className="px-4 py-4"><b>{x.student_name||"طالب"}</b><span className="mt-1 block text-[10px] text-[#8da0b9]" dir="ltr">{x.student_email||""}</span></td><td className="px-4 py-4 font-bold">{x.teacher_name||"معلم"}</td><td className="px-4 py-4">{x.subject||"غير محددة"}</td><td className="px-4 py-4">{date(x)}<span className="mt-1 block text-[10px] text-[#8da0b9]">{x.timezone||"Africa/Cairo"}</span></td><td className="px-4 py-4 font-extrabold">{money(x)}</td><td className="px-4 py-4">{x.payment_status==="paid"?"مدفوع":x.payment_status==="unpaid"?"غير مدفوع":x.payment_status||"—"}</td><td className="px-4 py-4"><span className={"inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold "+(x.status==="confirmed"?"bg-[#eafff5] text-[#16845b]":x.status==="pending"?"bg-[#fff4df] text-[#b96a00]":"bg-[#f1f5f9] text-[#52657d]")}>{statusNames[x.status]||x.status}</span></td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}


function ParentsAdmin(){
  type ParentRow={id:string;full_name:string|null;email:string|null;phone:string|null;country:string|null;city:string|null;account_status:string|null;created_at:string};
  const [items,setItems]=useState<ParentRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [error,setError]=useState("");
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    let alive=true;
    (async()=>{
      setLoading(true);
      setError("");
      const {data,error}=await supabase.from("profiles").select("id,full_name,email,phone,country,city,account_status,created_at").eq("role","parent").order("created_at",{ascending:false});
      if(!alive)return;
      if(error){
        console.error("Failed to load parent accounts",error);
        setError(error.message);
        setItems([]);
      }else{
        setItems((data??[]) as ParentRow[]);
      }
      setLoading(false);
    })();
    return ()=>{alive=false;};
  },[refresh]);
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return items.filter(x=>[x.full_name,x.email,x.phone,x.country,x.city].some(v=>String(v??"").toLowerCase().includes(q)));
  },[items,search]);
  const activeCount=items.filter(x=>x.account_status==="active").length;
  return <section className="rounded-[26px] border border-[#dfe8f2] bg-white shadow-sm">
    <div className="border-b border-[#e5ecf4] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-xl font-black">إدارة أولياء الأمور</h2><p className="mt-2 text-xs leading-6 text-[#8da0b9]">قائمة حسابات أولياء الأمور المسجلين على المنصة. الطلبات المرسلة من نموذج المساعدة تظهر بشكل منفصل في «طلبات أولياء الأمور» ولا تُعدّ حسابات دخول تلقائيًا.</p></div>
        <button type="button" onClick={()=>setRefresh(v=>v+1)} disabled={loading} className="shrink-0 rounded-xl bg-[#142a57] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50">{loading?"جارٍ التحديث...":"تحديث البيانات"}</button>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f7faff] px-3 py-3 sm:max-w-md"><Search className="h-4 w-4 text-[#8da0b9]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الهاتف..." className="w-full bg-transparent text-xs outline-none"/></div>
    </div>
    <div className="grid gap-3 p-6 sm:grid-cols-3"><div className="rounded-2xl bg-[#f7faff] p-4"><p className="text-[10px] font-bold text-[#8da0b9]">إجمالي أولياء الأمور المسجلين</p><b className="mt-1 block text-2xl font-black">{loading?"—":items.length}</b></div><div className="rounded-2xl bg-[#eafff5] p-4"><p className="text-[10px] font-bold text-[#16845b]">حسابات نشطة</p><b className="mt-1 block text-2xl font-black">{loading?"—":activeCount}</b></div><div className="rounded-2xl bg-[#eef4ff] p-4"><p className="text-[10px] font-bold text-[#3974ff]">نتائج البحث</p><b className="mt-1 block text-2xl font-black">{loading?"—":filtered.length}</b></div></div>
    <div className="px-6 pb-6">
      {loading?<div className="rounded-2xl bg-[#f8fbfd] p-8 text-center text-sm">جارٍ تحميل حسابات أولياء الأمور...</div>
      :error?<div className="rounded-2xl bg-[#fff0f1] p-5 text-sm text-[#c3344b]"><p className="font-extrabold">تعذر تحميل حسابات أولياء الأمور من قاعدة البيانات.</p><p className="mt-2 break-words font-mono text-xs" dir="ltr">{error}</p><p className="mt-2 text-xs leading-6">تحققي من صلاحيات القراءة وسياسات RLS في Supabase؛ لا تعني هذه الرسالة أن عدد الحسابات صفر.</p></div>
      :items.length===0?<div className="rounded-2xl bg-[#f8fbfd] p-8 text-center"><p className="font-extrabold text-[#263b5b]">لا توجد حسابات لأولياء أمور مسجلة حتى الآن.</p><p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-[#71849b]">إذا وصلتنا طلبات مساعدة تعليمية، فستظهر في صفحة «طلبات أولياء الأمور». إرسال الطلب لا ينشئ حسابًا على المنصة تلقائيًا.</p><a href="/admin/parent-requests" className="mt-4 inline-flex rounded-xl border border-[#dfe8f2] bg-white px-4 py-2.5 text-xs font-extrabold text-[#3974ff] hover:bg-[#f4f9ff]">عرض طلبات أولياء الأمور</a></div>
      :filtered.length===0?<div className="rounded-2xl bg-[#f8fbfd] p-8 text-center text-sm font-bold text-[#71849b]">لا توجد حسابات مطابقة للبحث. جرّبي اسمًا أو بريدًا أو رقم هاتف مختلفًا.</div>
      :<div className="overflow-x-auto rounded-2xl border border-[#e5ecf4]"><table className="w-full min-w-[600px] text-right text-xs"><thead className="bg-[#f8fbff] text-[#8da0b9]"><tr><th className="px-4 py-3">الاسم</th><th className="px-4 py-3">البريد الإلكتروني</th><th className="px-4 py-3">الهاتف</th><th className="px-4 py-3">المدينة / الدولة</th><th className="px-4 py-3">الحالة</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id} className="border-t border-[#edf1f6]"><td className="px-4 py-4 font-extrabold">{x.full_name||"بدون اسم"}</td><td className="px-4 py-4" dir="ltr">{x.email||"—"}</td><td className="px-4 py-4" dir="ltr">{x.phone||"—"}</td><td className="px-4 py-4">{[x.city,x.country].filter(Boolean).join("، ")||"—"}</td><td className="px-4 py-4">{x.account_status==="active"?"نشط":x.account_status==="suspended"?"موقوف":x.account_status==="deactivated"?"معطّل":x.account_status||"—"}</td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}

function AdminSection({title,location}:{title:string;location:string}){
  const details:Record<string,{description:string;items:string[];icon:any}>={
    "/admin/content":{description:"مساحة إدارة المحتوى التعليمي للمنصة. استخدمي الاختصارات للوصول مباشرة إلى الأقسام المرتبطة.",items:["مراجعة طلبات المعلمين","متابعة الطلاب المسجلين","عرض الحجوزات"],icon:BookOpen},
    "/admin/support":{description:"مركز متابعة دعم المستخدمين. عرض تذاكر الدعم والمحادثات يحتاج ربطه بجدول التذاكر في قاعدة البيانات.",items:["عرض المستخدمين","مراجعة طلبات المعلمين","عرض الحجوزات"],icon:Headphones},
    "/admin/audit":{description:"سجل متابعة إجراءات الإدارة. عرض الأحداث الفعلية يحتاج ربط سجل التدقيق بمصدر الأحداث في قاعدة البيانات.",items:["إدارة المستخدمين","طلبات المعلمين","الإعدادات"],icon:FileText},
    "/admin/settings":{description:"إعدادات إدارة المنصة. حفظ الإعدادات التشغيلية يحتاج تحديد القيم وربطها بقاعدة البيانات.",items:["إدارة المستخدمين","المالية والعمولة","سجل التدقيق"],icon:Settings}
  };
  const info=details[location]||{description:"تم فتح القسم المطلوب. اختاري أحد الاختصارات للوصول مباشرة إلى بيانات الإدارة المتاحة.",items:["إدارة المستخدمين","إدارة الطلاب","إدارة الحجوزات"],icon:LayoutDashboard};
  const Icon=info.icon;
  const links:Record<string,string>={"مراجعة طلبات المعلمين":"/admin/teachers","متابعة الطلاب المسجلين":"/admin/students","عرض الحجوزات":"/admin/bookings","عرض المستخدمين":"/admin/users","إدارة المستخدمين":"/admin/users","طلبات المعلمين":"/admin/teachers","الإعدادات":"/admin/settings","المالية والعمولة":"/admin/finance","سجل التدقيق":"/admin/audit","إدارة الطلاب":"/admin/students","إدارة الحجوزات":"/admin/bookings"};
  return <section className="rounded-[26px] border border-[#dfe8f2] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start gap-4 border-b border-[#e5ecf4] pb-6"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#eef4ff]"><Icon className="h-6 w-6 text-[#3974ff]"/></span><div><p className="text-[11px] font-extrabold text-[#3974ff]">إدارة المنصة</p><h2 className="mt-1 text-2xl font-black">{title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[#71849b]">{info.description}</p></div></div><h3 className="mt-6 font-black">اختصارات هذا القسم</h3><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{info.items.map(item=><Link key={item} href={links[item]||"/admin"} className="flex items-center gap-3 rounded-2xl border border-[#e5ecf4] bg-[#fbfdff] p-4 text-sm font-bold transition hover:border-[#b9d5ff] hover:bg-[#f4f9ff]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef4ff]"><ChevronLeft className="h-4 w-4 text-[#3974ff]"/></span>{item}<ChevronLeft className="mr-auto h-4 w-4 text-[#aebdd0]"/></Link>)}</div><Link href="/admin" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#142a57] px-5 py-3 text-sm font-bold text-white">العودة إلى لوحة الإدارة <ChevronLeft className="h-4 w-4"/></Link></section>;
}
    <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-[#e0e8f2] bg-white px-3 py-2.5 text-xs font-bold outline-none"><option value="all">كل الحالات</option><option value="pending">في انتظار التأكيد</option><option value="confirmed">مؤكد</option><option value="cancelled">ملغي</option><option value="completed">مكتمل</option><option value="rejected">مرفوض</option></select>
          <button onClick={()=>setRefresh(x=>x+1)} className="rounded-xl bg-[#142a57] px-4 py-2.5 text-xs font-extrabold text-white">تحديث</button>
        </div>
      </div>
    </div>
    <div className="grid gap-3 p-6 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl bg-[#f7faff] p-4"><p className="text-[10px] font-bold text-[#8da0b9]">إجمالي الحجوزات</p><b className="mt-1 block text-2xl font-black">{items.length}</b></div>
      <div className="rounded-2xl bg-[#fff6e8] p-4"><p className="text-[10px] font-bold text-[#b96a00]">بانتظار التأكيد</p><b className="mt-1 block text-2xl font-black">{items.filter(x=>x.status==="pending").length}</b></div>
      <div className="rounded-2xl bg-[#eafff5] p-4"><p className="text-[10px] font-bold text-[#16845b]">حجوزات مؤكدة</p><b className="mt-1 block text-2xl font-black">{items.filter(x=>x.status==="confirmed").length}</b></div>
      <div className="rounded-2xl bg-[#eef4ff] p-4"><p className="text-[10px] font-bold text-[#3974ff]">نتائج العرض</p><b className="mt-1 block text-2xl font-black">{filtered.length}</b></div>
    </div>
    <div className="px-6 pb-6">
      {loading?<div className="rounded-2xl bg-[#f8fbfd] p-10 text-center text-sm font-bold text-[#71849b]">جارٍ تحميل الحجوزات...</div>
      :error?<div className="rounded-2xl bg-[#fff0f1] p-5 text-sm font-bold text-[#c3344b]"><p>تعذر تحميل الحجوزات من قاعدة البيانات.</p><p className="mt-2 break-words font-mono text-xs" dir="ltr">{error}</p><p className="mt-2 text-xs">إذا كانت الرسالة متعلقة بالصلاحيات (RLS)، فسنحتاج إلى ضبط سياسة القراءة لحسابات الإدارة.</p></div>
      :filtered.length===0?<div className="rounded-2xl bg-[#f8fbfd] p-10 text-center"><CalendarDays className="mx-auto h-8 w-8 text-[#9aabc0]"/><h3 className="mt-3 font-extrabold">لا توجد حجوزات مطابقة</h3><p className="mt-1 text-xs text-[#8da0b9]">{items.length===0?"لم يتم تسجيل حجوزات بعد.":"جرّبي تغيير البحث أو حالة الحجز."}</p></div>
      :<div className="overflow-x-auto rounded-2xl border border-[#e5ecf4]"><table className="w-full min-w-[900px] text-right text-xs"><thead className="bg-[#f8fbff] text-[#8da0b9]"><tr><th className="px-4 py-3">الطالب</th><th className="px-4 py-3">المعلم</th><th className="px-4 py-3">المادة</th><th className="px-4 py-3">موعد الدرس</th><th className="px-4 py-3">القيمة</th><th className="px-4 py-3">الدفع</th><th className="px-4 py-3">الحالة</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id} className="border-t border-[#edf1f6] align-top"><td className="px-4 py-4"><b>{x.student_name||"طالب"}</b><span className="mt-1 block text-[10px] text-[#8da0b9]" dir="ltr">{x.student_email||""}</span></td><td className="px-4 py-4 font-bold">{x.teacher_name||"معلم"}</td><td className="px-4 py-4">{x.subject||"غير محددة"}</td><td className="px-4 py-4">{date(x)}<span className="mt-1 block text-[10px] text-[#8da0b9]">{x.timezone||"Africa/Cairo"}</span></td><td className="px-4 py-4 font-extrabold">{money(x)}</td><td className="px-4 py-4">{x.payment_status==="paid"?"مدفوع":x.payment_status==="unpaid"?"غير مدفوع":x.payment_status||"—"}</td><td className="px-4 py-4"><span className={"inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold "+(x.status==="confirmed"?"bg-[#eafff5] text-[#16845b]":x.status==="pending"?"bg-[#fff4df] text-[#b96a00]":"bg-[#f1f5f9] text-[#52657d]")}>{statusNames[x.status]||x.status}</span></td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}


function ParentsAdmin(){
  type ParentRow={id:string;full_name:string|null;email:string|null;phone:string|null;country:string|null;city:string|null;account_status:string|null;created_at:string};
  const [items,setItems]=useState<ParentRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [error,setError]=useState("");
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    let alive=true;
    (async()=>{
      setLoading(true);
      setError("");
      const {data,error}=await supabase.from("profiles").select("id,full_name,email,phone,country,city,account_status,created_at").eq("role","parent").order("created_at",{ascending:false});
      if(!alive)return;
      if(error){
        console.error("Failed to load parent accounts",error);
        setError(error.message);
        setItems([]);
      }else{
        setItems((data??[]) as ParentRow[]);
      }
      setLoading(false);
    })();
    return ()=>{alive=false;};
  },[refresh]);
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return items.filter(x=>[x.full_name,x.email,x.phone,x.country,x.city].some(v=>String(v??"").toLowerCase().includes(q)));
  },[items,search]);
  const activeCount=items.filter(x=>x.account_status==="active").length;
  return <section className="rounded-[26px] border border-[#dfe8f2] bg-white shadow-sm">
    <div className="border-b border-[#e5ecf4] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-xl font-black">إدارة أولياء الأمور</h2><p className="mt-2 text-xs leading-6 text-[#8da0b9]">قائمة حسابات أولياء الأمور المسجلين على المنصة. الطلبات المرسلة من نموذج المساعدة تظهر بشكل منفصل في «طلبات أولياء الأمور» ولا تُعدّ حسابات دخول تلقائيًا.</p></div>
        <button type="button" onClick={()=>setRefresh(v=>v+1)} disabled={loading} className="shrink-0 rounded-xl bg-[#142a57] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50">{loading?"جارٍ التحديث...":"تحديث البيانات"}</button>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f7faff] px-3 py-3 sm:max-w-md"><Search className="h-4 w-4 text-[#8da0b9]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الهاتف..." className="w-full bg-transparent text-xs outline-none"/></div>
    </div>
    <div className="grid gap-3 p-6 sm:grid-cols-3"><div className="rounded-2xl bg-[#f7faff] p-4"><p className="text-[10px] font-bold text-[#8da0b9]">إجمالي أولياء الأمور المسجلين</p><b className="mt-1 block text-2xl font-black">{loading?"—":items.length}</b></div><div className="rounded-2xl bg-[#eafff5] p-4"><p className="text-[10px] font-bold text-[#16845b]">حسابات نشطة</p><b className="mt-1 block text-2xl font-black">{loading?"—":activeCount}</b></div><div className="rounded-2xl bg-[#eef4ff] p-4"><p className="text-[10px] font-bold text-[#3974ff]">نتائج البحث</p><b className="mt-1 block text-2xl font-black">{loading?"—":filtered.length}</b></div></div>
    <div className="px-6 pb-6">
      {loading?<div className="rounded-2xl bg-[#f8fbfd] p-8 text-center text-sm">جارٍ تحميل حسابات أولياء الأمور...</div>
      :error?<div className="rounded-2xl bg-[#fff0f1] p-5 text-sm text-[#c3344b]"><p className="font-extrabold">تعذر تحميل حسابات أولياء الأمور من قاعدة البيانات.</p><p className="mt-2 break-words font-mono text-xs" dir="ltr">{error}</p><p className="mt-2 text-xs leading-6">تحققي من صلاحيات القراءة وسياسات RLS في Supabase؛ لا تعني هذه الرسالة أن عدد الحسابات صفر.</p></div>
      :items.length===0?<div className="rounded-2xl bg-[#f8fbfd] p-8 text-center"><p className="font-extrabold text-[#263b5b]">لا توجد حسابات لأولياء أمور مسجلة حتى الآن.</p><p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-[#71849b]">إذا وصلتنا طلبات مساعدة تعليمية، فستظهر في صفحة «طلبات أولياء الأمور». إرسال الطلب لا ينشئ حسابًا على المنصة تلقائيًا.</p><a href="/admin/parent-requests" className="mt-4 inline-flex rounded-xl border border-[#dfe8f2] bg-white px-4 py-2.5 text-xs font-extrabold text-[#3974ff] hover:bg-[#f4f9ff]">عرض طلبات أولياء الأمور</a></div>
      :filtered.length===0?<div className="rounded-2xl bg-[#f8fbfd] p-8 text-center text-sm font-bold text-[#71849b]">لا توجد حسابات مطابقة للبحث. جرّبي اسمًا أو بريدًا أو رقم هاتف مختلفًا.</div>
      :<div className="overflow-x-auto rounded-2xl border border-[#e5ecf4]"><table className="w-full min-w-[600px] text-right text-xs"><thead className="bg-[#f8fbff] text-[#8da0b9]"><tr><th className="px-4 py-3">الاسم</th><th className="px-4 py-3">البريد الإلكتروني</th><th className="px-4 py-3">الهاتف</th><th className="px-4 py-3">المدينة / الدولة</th><th className="px-4 py-3">الحالة</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id} className="border-t border-[#edf1f6]"><td className="px-4 py-4 font-extrabold">{x.full_name||"بدون اسم"}</td><td className="px-4 py-4" dir="ltr">{x.email||"—"}</td><td className="px-4 py-4" dir="ltr">{x.phone||"—"}</td><td className="px-4 py-4">{[x.city,x.country].filter(Boolean).join("، ")||"—"}</td><td className="px-4 py-4">{x.account_status==="active"?"نشط":x.account_status==="suspended"?"موقوف":x.account_status==="deactivated"?"معطّل":x.account_status||"—"}</td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}

function AdminSection({title,location}:{title:string;location:string}){
  const details:Record<string,{description:string;items:string[];icon:any}>={
    "/admin/content":{description:"مساحة إدارة المحتوى التعليمي للمنصة. استخدمي الاختصارات للوصول مباشرة إلى الأقسام المرتبطة.",items:["مراجعة طلبات المعلمين","متابعة الطلاب المسجلين","عرض الحجوزات"],icon:BookOpen},
    "/admin/support":{description:"مركز متابعة دعم المستخدمين. عرض تذاكر الدعم والمحادثات يحتاج ربطه بجدول التذاكر في قاعدة البيانات.",items:["عرض المستخدمين","مراجعة طلبات المعلمين","عرض الحجوزات"],icon:Headphones},
    "/admin/audit":{description:"سجل متابعة إجراءات الإدارة. عرض الأحداث الفعلية يحتاج ربط سجل التدقيق بمصدر الأحداث في قاعدة البيانات.",items:["إدارة المستخدمين","طلبات المعلمين","الإعدادات"],icon:FileText},
    "/admin/settings":{description:"إعدادات إدارة المنصة. حفظ الإعدادات التشغيلية يحتاج تحديد القيم وربطها بقاعدة البيانات.",items:["إدارة المستخدمين","المالية والعمولة","سجل التدقيق"],icon:Settings}
  };
  const info=details[location]||{description:"تم فتح القسم المطلوب. اختاري أحد الاختصارات للوصول مباشرة إلى بيانات الإدارة المتاحة.",items:["إدارة المستخدمين","إدارة الطلاب","إدارة الحجوزات"],icon:LayoutDashboard};
  const Icon=info.icon;
  const links:Record<string,string>={"مراجعة طلبات المعلمين":"/admin/teachers","متابعة الطلاب المسجلين":"/admin/students","عرض الحجوزات":"/admin/bookings","عرض المستخدمين":"/admin/users","إدارة المستخدمين":"/admin/users","طلبات المعلمين":"/admin/teachers","الإعدادات":"/admin/settings","المالية والعمولة":"/admin/finance","سجل التدقيق":"/admin/audit","إدارة الطلاب":"/admin/students","إدارة الحجوزات":"/admin/bookings"};
  return <section className="rounded-[26px] border border-[#dfe8f2] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start gap-4 border-b border-[#e5ecf4] pb-6"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#eef4ff]"><Icon className="h-6 w-6 text-[#3974ff]"/></span><div><p className="text-[11px] font-extrabold text-[#3974ff]">إدارة المنصة</p><h2 className="mt-1 text-2xl font-black">{title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[#71849b]">{info.description}</p></div></div><h3 className="mt-6 font-black">اختصارات هذا القسم</h3><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{info.items.map(item=><Link key={item} href={links[item]||"/admin"} className="flex items-center gap-3 rounded-2xl border border-[#e5ecf4] bg-[#fbfdff] p-4 text-sm font-bold transition hover:border-[#b9d5ff] hover:bg-[#f4f9ff]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef4ff]"><ChevronLeft className="h-4 w-4 text-[#3974ff]"/></span>{item}<ChevronLeft className="mr-auto h-4 w-4 text-[#aebdd0]"/></Link>)}</div><Link href="/admin" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#142a57] px-5 py-3 text-sm font-bold text-white">العودة إلى لوحة الإدارة <ChevronLeft className="h-4 w-4"/></Link></section>;
}
