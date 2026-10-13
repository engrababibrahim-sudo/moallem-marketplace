import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
function json(res: any, status: number, body: unknown) { res.setHeader("Content-Type","application/json; charset=utf-8"); return res.status(status).json(body); }
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.setHeader("Allow","POST"); return json(res,405,{error:"طريقة الطلب غير مدعومة."}); }
  const clientId=process.env.ZOOM_OAUTH_CLIENT_ID || process.env.ZOOM_CLIENT_ID;
  const redirectUri=process.env.ZOOM_OAUTH_REDIRECT_URI || "https://moallem-marketplace-nine.vercel.app/api/zoom/callback";
  const stateSecret=process.env.ZOOM_OAUTH_STATE_SECRET;
  const url=process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey=process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const auth=String(req.headers?.authorization || "");
  if(!clientId || !stateSecret || !url || !anonKey || !auth.startsWith("Bearer ")) return json(res,503,{error:"إعدادات ربط Zoom غير مكتملة على الخادم."});
  try {
    const userClient=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:auth}}});
    const {data,error}=await userClient.auth.getUser();
    if(error || !data.user) return json(res,401,{error:"يجب تسجيل الدخول أولًا."});
    const adminKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!adminKey) return json(res,503,{error:"خدمة الربط غير مهيأة."});
    const admin=createClient(url,adminKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:profile,error:profileError}=await admin.from("profiles").select("role").eq("id",data.user.id).maybeSingle();
    if(profileError) throw profileError;
    if(profile?.role!=="teacher") return json(res,403,{error:"ربط Zoom متاح لحسابات المعلمين فقط."});
    const key=new TextEncoder().encode(stateSecret);
    const state=await new SignJWT({sub:data.user.id,purpose:"teacher-zoom-connect"}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("10m").sign(key);
    const target=new URL("https://zoom.us/oauth/authorize");
    target.searchParams.set("response_type","code"); target.searchParams.set("client_id",clientId); target.searchParams.set("redirect_uri",redirectUri); target.searchParams.set("state",state);
    return json(res,200,{authorization_url:target.toString()});
  } catch(e) { console.error("Zoom connect init failed",e); return json(res,500,{error:"تعذر بدء ربط Zoom."}); }
}
