# تشغيل مُعلّم

## 1. Supabase
أنشئ مشروع Supabase جديدًا ثم افتح SQL Editor وشغّل الملفات بالترتيب:
1. supabase/migrations/0001_moallem_foundation.sql
2. supabase/migrations/0002_security_and_auth.sql
3. supabase/migrations/0003_security_hardening.sql

## 2. Authentication
فعّل Email في Authentication > Providers.
يفضل إبقاء تأكيد البريد مفعّلًا في البداية.

## 3. Environment Variables
ضع في Vercel وبيئة التطوير:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

استخدم publishable/anon key فقط في الواجهة. لا تضع service_role أو secret key في GitHub أو المتصفح.

## 4. أول مدير
أنشئ حسابك العادي من صفحة التسجيل، ثم غيّري دوره مرة واحدة من SQL Editor:
update public.profiles set role = 'super_admin' where email = 'YOUR_EMAIL';

لا يوجد أي طريق من واجهة التسجيل لإنشاء Admin.

## 5. Redirect URLs
في Authentication > URL Configuration أضف رابط الموقع المنشور ورابط التطوير:
http://localhost:3000

## 6. التشغيل
pnpm install
pnpm check
pnpm build:vercel

قاعدة البيانات هي مصدر الحقيقة للصلاحيات: RLS يمنع الوصول غير المصرح به حتى لو حاول المستخدم استدعاء Data API مباشرة.
